import uuid
from datetime import datetime
from typing import Literal

from pydantic import Field

from app.shared.enums import ChatResponseType, ChatRole, Department
from app.shared.schemas import CamelModel


class ChatRequestSchema(CamelModel):
    message: str
    department: Department | None = None
    topic: str | None = None


class ChatCitationSchema(CamelModel):
    document_id: uuid.UUID
    document_name: str
    department: Department
    page_number: int | None = None
    excerpt: str


class ClarificationSuggestionSchema(CamelModel):
    label: str
    department: Department
    topic: str


class ChatResponseSchema(CamelModel):
    type: ChatResponseType
    message: str
    detected_department: Department | None = None
    detected_topic: str | None = None
    citations: list[ChatCitationSchema] | None = None
    suggestions: list[ClarificationSuggestionSchema] | None = None


class ChatMessageSchema(CamelModel):
    id: uuid.UUID
    role: Literal["user", "assistant"]
    created_at: datetime
    text: str
    response: ChatResponseSchema | None = None
