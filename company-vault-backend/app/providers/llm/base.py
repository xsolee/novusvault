from dataclasses import dataclass, field
from typing import Protocol

from app.shared.enums import Department, DocumentCategory


@dataclass
class ClassificationResult:
    department: Department
    document_category: DocumentCategory
    confidence: float
    reason: str


@dataclass
class DocumentSummaryResult:
    title: str
    summary: str
    topics: list[str] = field(default_factory=list)
    important_dates: list[str] = field(default_factory=list)
    people: list[str] = field(default_factory=list)
    companies: list[str] = field(default_factory=list)


@dataclass
class ChatIntent:
    department: Department | None
    confidence: float
    topic: str | None
    per_department_scores: dict[str, float]


class LLMProvider(Protocol):
    async def classify_document(
        self, text: str, filename: str, folder_path: str
    ) -> ClassificationResult: ...

    async def summarize(self, text: str) -> DocumentSummaryResult: ...

    async def detect_chat_department_topic(
        self, question: str, known_departments: list[str], known_topics: list[str]
    ) -> ChatIntent: ...

    async def generate_answer(
        self, question: str, context_chunks: list[str], department: str, topic: str | None
    ) -> str: ...
