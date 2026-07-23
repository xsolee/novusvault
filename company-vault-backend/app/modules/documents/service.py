import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.documents.models import Document
from app.modules.documents.repository import (
    DocumentChunkRepository,
    DocumentEmbeddingRepository,
    DocumentRepository,
)
from app.modules.documents.schemas import (
    DocumentDetailsSchema,
    DocumentFiltersQuery,
    DocumentMetadataSchema,
    DocumentPageSchema,
    DocumentSummarySchema,
)
from app.providers.storage.factory import get_storage_provider
from app.shared.enums import DocumentProcessingStatus


class DocumentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = DocumentRepository(session)
        self.chunks = DocumentChunkRepository(session)
        self.embeddings = DocumentEmbeddingRepository(session)

    async def list_documents(self, filters: DocumentFiltersQuery) -> DocumentPageSchema:
        items, total = await self.repository.list_paginated(filters)
        return DocumentPageSchema(
            items=[self._to_summary(doc) for doc in items],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
        )

    async def get_details(self, document_id: uuid.UUID) -> DocumentDetailsSchema:
        document = await self.repository.get_by_id(document_id)
        if document is None:
            raise NotFoundError("Document not found")
        return self._to_details(document)

    async def get_content_url(self, document_id: uuid.UUID) -> str:
        document = await self.repository.get_by_id(document_id)
        if document is None:
            raise NotFoundError("Document not found")
        if not document.storage_key:
            raise NotFoundError("Document content is not available yet")
        return await get_storage_provider().get_presigned_url(document.storage_key)

    async def reprocess(self, document_id: uuid.UUID) -> DocumentSummarySchema:
        document = await self.repository.get_by_id(document_id)
        if document is None:
            raise NotFoundError("Document not found")

        document = await self.repository.update_status(document, DocumentProcessingStatus.PROCESSING)
        document.error_message = None
        await self.session.flush()

        # Actor built in Milestone 6; imported lazily so this module doesn't
        # hard-depend on workers/actors.py before it exists.
        from app.workers.actors import process_document_actor

        process_document_actor.send(str(document.id), None)

        return self._to_summary(document)

    async def search_chunks(
        self,
        *,
        query_vector: list[float] | None,
        query_text: str,
        department: str | None,
        category: str | None,
        top_k: int = 5,
    ):
        """Hybrid retrieval used by knowledge/service.py — knowledge never
        touches documents/repository.py directly, only this entry point."""
        vector_hits = (
            await self.embeddings.similarity_search(
                query_vector, department=department, category=category, top_k=top_k
            )
            if query_vector is not None
            else []
        )
        text_hits = await self.embeddings.fulltext_search(
            query_text, department=department, category=category, top_k=top_k
        )

        by_chunk_id = {}
        for chunk, document, distance in vector_hits:
            by_chunk_id[chunk.id] = (chunk, document, 0.7 * (1 - distance))
        for chunk, document, rank in text_hits:
            if chunk.id in by_chunk_id:
                existing_chunk, existing_document, score = by_chunk_id[chunk.id]
                by_chunk_id[chunk.id] = (existing_chunk, existing_document, score + 0.3 * rank)
            else:
                by_chunk_id[chunk.id] = (chunk, document, 0.3 * rank)

        ranked = sorted(by_chunk_id.values(), key=lambda item: item[2], reverse=True)
        return ranked[:top_k]

    def _to_summary(self, document: Document) -> DocumentSummarySchema:
        return DocumentSummarySchema(
            id=document.id,
            filename=document.filename,
            department=document.department,
            category=document.category,
            source="GOOGLE_DRIVE",
            folder_path=document.folder_path,
            status=document.status,
            indexed_at=document.indexed_at,
        )

    def _to_details(self, document: Document) -> DocumentDetailsSchema:
        summary = self._to_summary(document)
        return DocumentDetailsSchema(
            **summary.model_dump(),
            mime_type=document.mime_type,
            drive_link=document.drive_link,
            extracted_text=document.extracted_text
            or "No extracted text preview is available for this document yet.",
            metadata=DocumentMetadataSchema(
                title=document.title or document.filename,
                department=document.department,
                category=document.category,
                summary=document.summary or "This document has not been fully processed yet.",
                topics=document.topics or [],
                important_dates=document.important_dates or [],
                people=document.people or [],
                companies=document.companies or [],
            ),
        )
