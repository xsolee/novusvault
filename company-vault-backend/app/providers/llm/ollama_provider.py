import json
import logging

import httpx

from app.core.config import get_settings
from app.providers.llm.base import ChatIntent, ClassificationResult, DocumentSummaryResult
from app.shared.enums import Department, DocumentCategory

logger = logging.getLogger(__name__)
settings = get_settings()

_DEPARTMENTS = [d.value for d in Department]
_CATEGORIES = [c.value for c in DocumentCategory]

_CLASSIFY_PROMPT = """Classify this company document. Respond with ONLY a JSON object (no markdown, \
no commentary) with exactly these keys:
- "department": one of {departments}
- "document_category": one of {categories}
- "confidence": a number between 0 and 1
- "reason": a short explanation (one sentence)

Filename: {filename}
Folder path: {folder_path}

Document text (may be truncated):
{text}
"""

_SUMMARIZE_PROMPT = """Summarize this company document. Respond with ONLY a JSON object (no markdown, \
no commentary) with exactly these keys:
- "title": a short descriptive title
- "summary": a 2-4 sentence summary
- "topics": a list of up to 5 short topic strings
- "important_dates": a list of any dates mentioned (as they appear in the text), up to 5
- "people": a list of person names mentioned, up to 10
- "companies": a list of company/organization names mentioned, up to 10

Document text (may be truncated):
{text}
"""

_INTENT_PROMPT = """A user asked a question about company documents. Determine which department the \
question relates to and what specific topic it's about. Respond with ONLY a JSON object (no markdown, \
no commentary) with exactly these keys:
- "department": the single best-matching department from {departments}, or null if genuinely unclear
- "confidence": a number 0-1 for how confident you are in that department
- "topic": a short topic string describing what specifically is being asked, or null
- "per_department_scores": a JSON object mapping EACH of these departments {departments} to a 0-1 \
relevance score for this question

Known topics already seen in the index (context only, not exhaustive): {topics}

Question: {question}
"""

_ANSWER_SYSTEM = """You are Company Vault's assistant. Answer ONLY using the provided context excerpts \
from indexed company documents — never use outside/general knowledge as if it were a company fact. \
Refer to the excerpts naturally as your source. If the excerpts don't actually answer the question, \
say so plainly instead of guessing."""

_ANSWER_PROMPT = """Department: {department}
Topic: {topic}

Context excerpts from indexed company documents:
{context}

Question: {question}

Answer using only the context above."""


def _truncate(text: str, max_chars: int = 6000) -> str:
    return text if len(text) <= max_chars else text[:max_chars] + "\n...[truncated]"


class OllamaLLMProvider:
    """Real LLM provider backed by a self-hosted Ollama instance — the default provider so
    `docker compose up` is demoable with no external API key. Uses Ollama's `format: "json"`
    constrained decoding for the structured calls, with a safe fallback (mirroring
    MockLLMProvider's fallback shape) since even constrained decoding on a small local model
    isn't a hard guarantee of well-formed, schema-matching JSON."""

    def __init__(self) -> None:
        self._model = settings.ollama_llm_model
        self._client = httpx.AsyncClient(
            base_url=settings.ollama_base_url,
            timeout=httpx.Timeout(settings.ollama_request_timeout_seconds),
        )

    async def _generate_json(self, prompt: str) -> dict:
        response = await self._client.post(
            "/api/generate",
            json={"model": self._model, "prompt": prompt, "stream": False, "format": "json"},
        )
        response.raise_for_status()
        raw = response.json()["response"]
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            logger.warning("Ollama returned invalid JSON, using fallback: %r", raw[:200])
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
            reason=str(data.get("reason") or "ollama fallback classification"),
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
        response = await self._client.post(
            "/api/generate",
            json={"model": self._model, "system": _ANSWER_SYSTEM, "prompt": prompt, "stream": False},
        )
        response.raise_for_status()
        return response.json()["response"].strip()
