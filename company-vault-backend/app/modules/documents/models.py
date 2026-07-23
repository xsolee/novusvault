import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.shared.enums import Department, DocumentCategory, DocumentProcessingStatus, DocumentSource


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    drive_connection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("drive_connections.id"), nullable=False)
    last_sync_run_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sync_runs.id"), nullable=True)
    # Dedupe key — one Drive account, no change detection, matched by file ID.
    google_file_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str] = mapped_column(String, nullable=False)
    folder_path: Mapped[str] = mapped_column(String, nullable=False)
    drive_folder_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("drive_folders.id"), nullable=True)
    drive_link: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=False, default=DocumentSource.GOOGLE_DRIVE)
    department: Mapped[str] = mapped_column(String, nullable=False, default=Department.UNKNOWN)
    category: Mapped[str] = mapped_column(String, nullable=False, default=DocumentCategory.OTHER)
    status: Mapped[str] = mapped_column(String, nullable=False, default=DocumentProcessingStatus.PENDING)
    classification_confidence: Mapped[float | None] = mapped_column(nullable=True)
    classification_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String, nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_applied: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    topics: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    important_dates: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    people: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    companies: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    indexed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = (UniqueConstraint("document_id", "chunk_index"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    chunk_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document_chunks.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=False)
    embedding_model: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
