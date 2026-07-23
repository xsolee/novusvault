import re
from collections import Counter

from app.providers.llm.base import ChatIntent, ClassificationResult, DocumentSummaryResult
from app.shared.classification import detect_department, guess_topic, score_departments
from app.shared.enums import Department, DocumentCategory

_DATE_PATTERN = re.compile(
    r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|"
    r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+\d{1,2},?\s+\d{4})\b",
    re.IGNORECASE,
)
_STOPWORDS = {
    "the", "and", "for", "that", "with", "this", "from", "have", "will", "shall",
    "which", "their", "these", "those", "such", "into", "upon", "when", "where",
}


class MockLLMProvider:
    """Deterministic, no external calls — the default so `docker compose up`
    is demoable without an LLM API key. Real classification only reaches this
    provider as tier-3 fallback (tiers 1-2 are folder/filename and keyword
    rules in documents/classification_rules.py)."""

    async def classify_document(self, text: str, filename: str, folder_path: str) -> ClassificationResult:
        department, confidence, _ = detect_department(f"{filename} {folder_path} {text}")
        return ClassificationResult(
            department=department or Department.GENERAL,
            document_category=DocumentCategory.OTHER,
            confidence=confidence if department else 0.5,
            reason="mock fallback classification" if not department else "mock keyword classification",
        )

    async def summarize(self, text: str) -> DocumentSummaryResult:
        clean = text.strip()
        summary = clean[:240] + ("..." if len(clean) > 240 else "")

        words = [w.lower().strip(".,;:()\"'") for w in clean.split()]
        candidates = [w for w in words if len(w) > 4 and w not in _STOPWORDS]
        top_words = [word for word, _ in Counter(candidates).most_common(5)]

        return DocumentSummaryResult(
            title=summary[:80] if summary else "Untitled document",
            summary=summary or "No extracted text preview is available for this document yet.",
            topics=[w.capitalize() for w in top_words],
            important_dates=_DATE_PATTERN.findall(clean)[:5],
            people=[],
            companies=[],
        )

    async def detect_chat_department_topic(
        self, question: str, known_departments: list[str], known_topics: list[str]
    ) -> ChatIntent:
        scores = score_departments(question)
        confidences = {dept: min(0.95, 0.6 + count * 0.15) for dept, count in scores.items()}
        department, confidence, _ = detect_department(question)
        topic = guess_topic(question) if department else None
        return ChatIntent(
            department=department,
            confidence=confidence,
            topic=topic,
            per_department_scores={d.value: c for d, c in confidences.items()},
        )

    async def generate_answer(
        self, question: str, context_chunks: list[str], department: str, topic: str | None
    ) -> str:
        excerpt = context_chunks[0] if context_chunks else ""
        department_label = department.replace("_", " ").lower()
        return (
            f"Based on the indexed {department_label} documents: {excerpt} "
            "This is drawn directly from the cited document below — see the citation for full context."
        )
