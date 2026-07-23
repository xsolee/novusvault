import uuid
from datetime import UTC, datetime

from sqlalchemy import Select, and_, delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.documents.models import Document, DocumentChunk, DocumentEmbedding
from app.modules.documents.schemas import DocumentFiltersQuery
from app.shared.enums import DocumentProcessingStatus


class DocumentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, document_id: uuid.UUID) -> Document | None:
        return await self.session.get(Document, document_id)

    async def get_by_google_file_id(self, google_file_id: str) -> Document | None:
        result = await self.session.execute(select(Document).where(Document.google_file_id == google_file_id))
        return result.scalar_one_or_none()

    async def upsert_from_drive_file(
        self,
        *,
        drive_connection_id: uuid.UUID,
        google_file_id: str,
        filename: str,
        mime_type: str,
        folder_path: str,
        drive_folder_id: uuid.UUID | None,
        drive_link: str | None,
        size_bytes: int | None,
        last_sync_run_id: uuid.UUID | None,
    ) -> Document:
        existing = await self.get_by_google_file_id(google_file_id)
        if existing is not None:
            existing.filename = filename
            existing.mime_type = mime_type
            existing.folder_path = folder_path
            existing.drive_folder_id = drive_folder_id
            existing.drive_link = drive_link
            existing.size_bytes = size_bytes
            if last_sync_run_id is not None:
                existing.last_sync_run_id = last_sync_run_id
            await self.session.flush()
            return existing

        document = Document(
            drive_connection_id=drive_connection_id,
            google_file_id=google_file_id,
            filename=filename,
            mime_type=mime_type,
            folder_path=folder_path,
            drive_folder_id=drive_folder_id,
            drive_link=drive_link,
            size_bytes=size_bytes,
            last_sync_run_id=last_sync_run_id,
            status=DocumentProcessingStatus.PENDING,
        )
        self.session.add(document)
        await self.session.flush()
        return document

    def _apply_filters(self, stmt: Select, filters: DocumentFiltersQuery) -> Select:
        if filters.search:
            stmt = stmt.where(Document.filename.ilike(f"%{filters.search}%"))
        if filters.department:
            stmt = stmt.where(Document.department == filters.department.value)
        if filters.category:
            stmt = stmt.where(Document.category == filters.category.value)
        if filters.status:
            stmt = stmt.where(Document.status == filters.status.value)
        return stmt

    async def list_paginated(self, filters: DocumentFiltersQuery) -> tuple[list[Document], int]:
        base = self._apply_filters(select(Document), filters)

        count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        page_stmt = (
            base.order_by(Document.created_at.desc())
            .offset((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
        )
        items = (await self.session.execute(page_stmt)).scalars().all()
        return list(items), total

    async def update_status(self, document: Document, status: DocumentProcessingStatus) -> Document:
        document.status = status
        await self.session.flush()
        return document

    async def update_extracted_content(
        self, document: Document, *, extracted_text: str, ocr_applied: bool, storage_key: str
    ) -> Document:
        document.extracted_text = extracted_text
        document.ocr_applied = ocr_applied
        document.storage_key = storage_key
        await self.session.flush()
        return document

    async def update_classification(
        self,
        document: Document,
        *,
        department: str,
        category: str,
        confidence: float,
        reason: str,
    ) -> Document:
        document.department = department
        document.category = category
        document.classification_confidence = confidence
        document.classification_reason = reason
        await self.session.flush()
        return document

    async def update_metadata(
        self,
        document: Document,
        *,
        title: str,
        summary: str,
        topics: list[str],
        important_dates: list[str],
        people: list[str],
        companies: list[str],
    ) -> Document:
        document.title = title
        document.summary = summary
        document.topics = topics
        document.important_dates = important_dates
        document.people = people
        document.companies = companies
        await self.session.flush()
        return document

    async def mark_indexed(self, document: Document) -> Document:
        document.status = DocumentProcessingStatus.INDEXED
        document.indexed_at = datetime.now(UTC)
        document.error_message = None
        await self.session.flush()
        return document

    async def mark_failed(self, document: Document, error_message: str) -> Document:
        document.status = DocumentProcessingStatus.FAILED
        document.error_message = error_message
        await self.session.flush()
        return document

    async def distinct_indexed_departments(self) -> list[str]:
        result = await self.session.execute(
            select(Document.department)
            .where(Document.status == DocumentProcessingStatus.INDEXED)
            .distinct()
        )
        return [row[0] for row in result.all()]


class DocumentChunkRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def bulk_insert(self, chunks: list[DocumentChunk]) -> None:
        self.session.add_all(chunks)
        await self.session.flush()

    async def delete_for_document(self, document_id: uuid.UUID) -> None:
        await self.session.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
        await self.session.flush()


class DocumentEmbeddingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def bulk_insert(self, embeddings: list[DocumentEmbedding]) -> None:
        self.session.add_all(embeddings)
        await self.session.flush()

    async def delete_for_document(self, document_id: uuid.UUID) -> None:
        chunk_ids = select(DocumentChunk.id).where(DocumentChunk.document_id == document_id)
        await self.session.execute(delete(DocumentEmbedding).where(DocumentEmbedding.chunk_id.in_(chunk_ids)))
        await self.session.flush()

    async def similarity_search(
        self,
        query_vector: list[float],
        *,
        department: str | None,
        category: str | None,
        top_k: int = 5,
    ) -> list[tuple[DocumentChunk, Document, float]]:
        from app.modules.documents.models import Document as DocumentModel

        stmt = (
            select(
                DocumentChunk,
                DocumentModel,
                DocumentEmbedding.embedding.cosine_distance(query_vector).label("distance"),
            )
            .join(DocumentChunk, DocumentEmbedding.chunk_id == DocumentChunk.id)
            .join(DocumentModel, DocumentChunk.document_id == DocumentModel.id)
            .where(DocumentModel.status == DocumentProcessingStatus.INDEXED)
        )
        if department:
            stmt = stmt.where(DocumentModel.department == department)
        if category:
            stmt = stmt.where(DocumentModel.category == category)
        stmt = stmt.order_by(text("distance")).limit(top_k)

        rows = (await self.session.execute(stmt)).all()
        return [(chunk, doc, float(distance)) for chunk, doc, distance in rows]

    async def fulltext_search(
        self,
        query_text: str,
        *,
        department: str | None,
        category: str | None,
        top_k: int = 5,
    ) -> list[tuple[DocumentChunk, Document, float]]:
        from app.modules.documents.models import Document as DocumentModel

        ts_query = func.plainto_tsquery("english", query_text)
        rank = func.ts_rank(func.to_tsvector("english", DocumentChunk.content), ts_query).label("rank")

        stmt = (
            select(DocumentChunk, DocumentModel, rank)
            .join(DocumentModel, DocumentChunk.document_id == DocumentModel.id)
            .where(
                and_(
                    DocumentModel.status == DocumentProcessingStatus.INDEXED,
                    func.to_tsvector("english", DocumentChunk.content).op("@@")(ts_query),
                )
            )
        )
        if department:
            stmt = stmt.where(DocumentModel.department == department)
        if category:
            stmt = stmt.where(DocumentModel.category == category)
        stmt = stmt.order_by(rank.desc()).limit(top_k)

        rows = (await self.session.execute(stmt)).all()
        return [(chunk, doc, float(rank_value)) for chunk, doc, rank_value in rows]
