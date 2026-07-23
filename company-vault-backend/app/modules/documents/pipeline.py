"""The 8-stage ingestion pipeline: download -> extract text -> OCR (only for
images/scanned/low-text PDFs) -> classify department -> classify category ->
summarize/extract topics -> chunk -> embed -> mark indexed. Called by
workers/actors.py:process_document_actor. Every stage is safe to redo on
retry — nothing here assumes it's the first attempt."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ValidationAppError
from app.modules.documents import chunking, extraction
from app.modules.documents.classification_rules import classify_category_by_rules, classify_department_by_rules
from app.modules.documents.models import Document, DocumentChunk, DocumentEmbedding
from app.modules.documents.repository import DocumentChunkRepository, DocumentEmbeddingRepository, DocumentRepository
from app.providers.drive.base import SourceConnector
from app.providers.embeddings.factory import get_embedding_provider
from app.providers.llm.factory import get_llm_provider
from app.providers.ocr.factory import get_ocr_provider
from app.providers.storage.factory import get_storage_provider
from app.shared.enums import DocumentCategory, Department, SyncStage
from app.modules.sync.repository import SyncRunRepository

settings = get_settings()

_SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "text/csv",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "image/bmp",
    "image/webp",
}
_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


async def run_pipeline(
    session: AsyncSession,
    document: Document,
    connector: SourceConnector,
    *,
    sync_run_id: uuid.UUID | None = None,
) -> None:
    documents_repo = DocumentRepository(session)
    chunks_repo = DocumentChunkRepository(session)
    embeddings_repo = DocumentEmbeddingRepository(session)
    sync_runs_repo = SyncRunRepository(session) if sync_run_id else None

    async def set_stage(stage: SyncStage) -> None:
        if sync_runs_repo and sync_run_id:
            await sync_runs_repo.update_stage_and_filename(sync_run_id, stage, document.filename)

    # 1. download
    await set_stage(SyncStage.DOWNLOADING_FILES)

    if document.mime_type not in _SUPPORTED_MIME_TYPES:
        raise ValidationAppError(
            f"Unsupported file type '{document.mime_type}' for '{document.filename}'",
            error_code="unsupported_mime_type",
        )

    file_bytes = await connector.download_file(document.google_file_id)

    if len(file_bytes) > _MAX_FILE_SIZE_BYTES:
        raise ValidationAppError(
            f"'{document.filename}' is {len(file_bytes)} bytes, exceeding the "
            f"{_MAX_FILE_SIZE_BYTES} byte ingestion limit",
            error_code="file_too_large",
        )

    storage_key = f"documents/{document.id}/{document.filename}"
    await get_storage_provider().upload(storage_key, file_bytes, document.mime_type)

    # 2. extract text
    await set_stage(SyncStage.EXTRACTING_TEXT)
    text = extraction.extract_native_text(file_bytes, document.mime_type)

    # 3. OCR (only for images/scanned/low-text PDFs)
    ocr_applied = False
    is_pdf = document.mime_type == "application/pdf"
    needs_ocr = extraction.is_image(document.mime_type) or (
        is_pdf and extraction.is_low_text_pdf(file_bytes, text)
    )
    if needs_ocr:
        await set_stage(SyncStage.RUNNING_OCR)
        ocr_provider = get_ocr_provider()
        if extraction.is_image(document.mime_type):
            result = await ocr_provider.extract_text(file_bytes, document.mime_type)
            text = result.text
        else:
            page_texts = []
            for page_image in extraction.rasterize_pdf_pages(file_bytes):
                result = await ocr_provider.extract_text(page_image, "image/png")
                page_texts.append(result.text)
            text = "\n\n".join(page_texts) or text
        ocr_applied = True

    await documents_repo.update_extracted_content(
        document, extracted_text=text, ocr_applied=ocr_applied, storage_key=storage_key
    )

    # 4-5. classify department + category (tier 1/2 rules, tier 3 LLM fallback)
    await set_stage(SyncStage.DETECTING_DEPARTMENT)
    llm_provider = get_llm_provider()

    department_rule = classify_department_by_rules(filename=document.filename, folder_path=document.folder_path)
    category_rule = classify_category_by_rules(filename=document.filename)

    department: Department
    category: DocumentCategory
    confidence: float
    reason_parts: list[str] = []

    if department_rule is not None and category_rule is not None:
        department, dept_reason = department_rule
        category, cat_reason = category_rule
        confidence = 0.9
        reason_parts = [dept_reason, cat_reason]
    else:
        llm_result = await llm_provider.classify_document(text, document.filename, document.folder_path)
        department = department_rule[0] if department_rule else llm_result.department
        category = category_rule[0] if category_rule else llm_result.document_category
        confidence = llm_result.confidence
        if department_rule:
            reason_parts.append(department_rule[1])
        if category_rule:
            reason_parts.append(category_rule[1])
        reason_parts.append(f"LLM fallback: {llm_result.reason}")

    await documents_repo.update_classification(
        document,
        department=department.value,
        category=category.value,
        confidence=confidence,
        reason="; ".join(reason_parts),
    )

    # 6. summarize/extract topics
    summary_result = await llm_provider.summarize(text)
    await documents_repo.update_metadata(
        document,
        title=summary_result.title,
        summary=summary_result.summary,
        topics=summary_result.topics,
        important_dates=summary_result.important_dates,
        people=summary_result.people,
        companies=summary_result.companies,
    )

    # 7. chunk
    await set_stage(SyncStage.CREATING_EMBEDDINGS)
    await chunks_repo.delete_for_document(document.id)
    chunk_specs = chunking.chunk_text(
        text, chunk_size_tokens=settings.chunk_size_tokens, chunk_overlap_tokens=settings.chunk_overlap_tokens
    )
    chunk_rows = [
        DocumentChunk(document_id=document.id, chunk_index=i, content=c.content, token_count=c.token_count)
        for i, c in enumerate(chunk_specs)
    ]
    await chunks_repo.bulk_insert(chunk_rows)

    # 8. embed
    await embeddings_repo.delete_for_document(document.id)
    if chunk_rows:
        embedding_provider = get_embedding_provider()
        vectors = await embedding_provider.embed_batch([c.content for c in chunk_rows])
        embedding_rows = [
            DocumentEmbedding(chunk_id=chunk.id, embedding=vector, embedding_model=type(embedding_provider).__name__)
            for chunk, vector in zip(chunk_rows, vectors, strict=True)
        ]
        await embeddings_repo.bulk_insert(embedding_rows)

    await documents_repo.mark_indexed(document)
