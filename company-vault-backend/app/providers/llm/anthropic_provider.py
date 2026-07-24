import json
import logging

import anthropic

from app.core.config import get_settings
from app.providers.llm.base import ChatIntent, ClassificationResult, DocumentSummaryResult
from app.providers.llm.ollama_provider import (
    _ANSWER_PROMPT,
    _ANSWER_SYSTEM,
    _CATEGORIES,
    _CLASSIFY_PROMPT,
    _DEPARTMENTS,
    _INTENT_PROMPT,
    _SUMMARIZE_PROMPT,
    _truncate,
)
from app.shared.enums import Department, DocumentCategory

logger = logging.getLogger(__name__)
settings = get_settings()

_JSON_SYSTEM = "Respond with ONLY the JSON object requested — no markdown fences, no commentary."


class AnthropicLLMProvider:
    """LLM_PROVIDER=anthropic — a hosted swap-in for OllamaLLMProvider, same LLMProvider
    interface. Reuses Ollama's prompt templates (they're provider-agnostic instructions, not
    Ollama-specific syntax) so the two providers stay behaviorally interchangeable."""

    def __init__(self) -> None:
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY must be set when LLM_PROVIDER=anthropic")
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    async def _generate_json(self, prompt: str) -> dict:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=_JSON_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            logger.warning("Anthropic returned invalid JSON, using fallback: %r", raw[:200])
            return {}

    async def classify_document(
        self, text: str, filename: str, folder_path: str
    ) -> ClassificationResult:
        prompt = _CLASSIFY_PROMPT.format(
            departments=_DEPARTMENTS,
            categories=_CATEGORIES,
            filename=filename,
            folder_path=folder_path,
            text=_truncate(text),
        )
        data = await self._generate_json(prompt)
        try:
            department = Department(data["department"])
        except (KeyError, ValueError):
            department = Department.GENERAL
        try:
            category = DocumentCategory(data["document_category"])
        except (KeyError, ValueError):
            category = DocumentCategory.OTHER
        return ClassificationResult(
            department=department,
            document_category=category,
            confidence=float(data.get("confidence") or 0.5),
            reason=str(data.get("reason") or "anthropic fallback classification"),
        )

    async def summarize(self, text: str) -> DocumentSummaryResult:
        data = await self._generate_json(_SUMMARIZE_PROMPT.format(text=_truncate(text)))
        return DocumentSummaryResult(
            title=str(data.get("title") or "Untitled document"),
            summary=str(data.get("summary") or "No summary could be generated for this document."),
            topics=[str(t) for t in data.get("topics", [])][:5],
            important_dates=[str(d) for d in data.get("important_dates", [])][:5],
            people=[str(p) for p in data.get("people", [])][:10],
            companies=[str(c) for c in data.get("companies", [])][:10],
        )

    async def detect_chat_department_topic(
        self, question: str, known_departments: list[str], known_topics: list[str]
    ) -> ChatIntent:
        prompt = _INTENT_PROMPT.format(
            departments=_DEPARTMENTS, topics=known_topics[:20], question=question
        )
        data = await self._generate_json(prompt)
        department: Department | None
        try:
            department = Department(data["department"]) if data.get("department") else None
        except ValueError:
            department = None
        raw_scores = data.get("per_department_scores") or {}
        per_department_scores = {
            dept: float(raw_scores[dept])
            for dept in _DEPARTMENTS
            if dept in raw_scores and isinstance(raw_scores[dept], (int, float))
        }
        return ChatIntent(
            department=department,
            confidence=float(data.get("confidence") or 0.0),
            topic=data.get("topic") or None,
            per_department_scores=per_department_scores,
        )

    async def generate_answer(
        self, question: str, context_chunks: list[str], department: str, topic: str | None
    ) -> str:
        context = "\n\n---\n\n".join(context_chunks) if context_chunks else "(no context retrieved)"
        prompt = _ANSWER_PROMPT.format(
            department=department,
            topic=topic or "(none)",
            context=_truncate(context, 8000),
            question=question,
        )
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=_ANSWER_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
