import uuid
from datetime import datetime
from typing import Literal

from pydantic import Field

from app.shared.enums import Department, DocumentCategory, DocumentProcessingStatus
from app.shared.schemas import CamelModel


class DocumentSummarySchema(CamelModel):
    id: uuid.UUID
    filename: str
    department: Department
    category: DocumentCategory
    source: Literal["GOOGLE_DRIVE"] = "GOOGLE_DRIVE"
    folder_path: str
    status: DocumentProcessingStatus
    indexed_at: datetime | None = None


class DocumentMetadataSchema(CamelModel):
    title: str
    department: Department
    category: DocumentCategory
    summary: str
    topics: list[str] = Field(default_factory=list)
    important_dates: list[str] = Field(default_factory=list)
    people: list[str] = Field(default_factory=list)
    companies: list[str] = Field(default_factory=list)


class DocumentDetailsSchema(DocumentSummarySchema):
    mime_type: str
    drive_link: str | None = None
    extracted_text: str
    metadata: DocumentMetadataSchema


class DocumentPageSchema(CamelModel):
    items: list[DocumentSummarySchema]
    total: int
    page: int
    page_size: int


class DocumentFiltersQuery(CamelModel):
    search: str | None = None
    department: Department | None = None
    category: DocumentCategory | None = None
    status: DocumentProcessingStatus | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
