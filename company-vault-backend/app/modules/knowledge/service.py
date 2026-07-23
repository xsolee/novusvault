import uuid
from collections import Counter

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.service import DocumentService
from app.modules.knowledge.repository import ChatCitationRepository, ChatConversationRepository, ChatMessageRepository
from app.modules.knowledge.models import ChatCitation
from app.modules.knowledge.schemas import (
    ChatCitationSchema,
    ChatMessageSchema,
    ChatRequestSchema,
    ChatResponseSchema,
    ClarificationSuggestionSchema,
)
from app.providers.embeddings.factory import get_embedding_provider
from app.providers.llm.factory import get_llm_provider
from app.shared.classification import detect_department, guess_topic, is_broad_question
from app.shared.enums import ChatResponseType, ChatRole, Department

settings = get_settings()

_MAX_SUGGESTIONS = 4
_RETRIEVAL_TOP_K = 5


class KnowledgeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.conversations = ChatConversationRepository(session)
        self.messages = ChatMessageRepository(session)
        self.citations = ChatCitationRepository(session)
        self.documents_repo = DocumentRepository(session)
        self.documents_service = DocumentService(session)

    async def handle_chat(self, admin_id: uuid.UUID, request: ChatRequestSchema) -> ChatResponseSchema:
        conversation = await self.conversations.get_or_create_for_admin(admin_id)
        await self.messages.add(conversation_id=conversation.id, role=ChatRole.USER, text=request.message)

        indexed_departments = set(await self.documents_repo.distinct_indexed_departments())

        department, confidence = await self._detect_department(request, indexed_departments)
        topic = request.topic or (guess_topic(request.message) if department else None)

        # Two distinct "not enough to answer" outcomes, matching the frontend
        # contract exactly:
        #  - broad/ambiguous wording, or a tentative department that isn't
        #    confidently distinguishable from the runner-up -> ask to clarify
        #    (never invents suggestions — only departments actually indexed).
        #  - no department signal at all, or one with no indexed coverage ->
        #    no_results (nothing to clarify toward).
        is_broad = is_broad_question(request.message, confidence)
        gap = await self._confidence_gap(request.message, department, confidence) if department else 0.0
        is_ambiguous_candidate = department is not None and (
            confidence < settings.chat_department_confidence_threshold
            or gap < settings.chat_department_gap_threshold
        )

        if is_broad or is_ambiguous_candidate:
            suggestions = await self._build_suggestions(indexed_departments)
            response = ChatResponseSchema(
                type=ChatResponseType.CLARIFICATION_REQUIRED,
                message="Which department or topic is this about? Here are a few options based on what's indexed.",
                suggestions=suggestions,
            )
            await self._persist_response(conversation.id, response)
            return response

        if department is None or department.value not in indexed_departments:
            response = ChatResponseSchema(
                type=ChatResponseType.NO_RESULTS,
                message=(
                    "I could not find enough information in the indexed company documents to answer "
                    "that. Try rephrasing, or pick a department in Documents to browse what is indexed."
                ),
                citations=[],
            )
            await self._persist_response(conversation.id, response)
            return response

        embedding_provider = get_embedding_provider()
        query_vector = await embedding_provider.embed_text(request.message)
        ranked_hits = await self.documents_service.search_chunks(
            query_vector=query_vector,
            query_text=request.message,
            department=department.value,
            category=None,
            top_k=_RETRIEVAL_TOP_K,
        )

        if not ranked_hits:
            response = ChatResponseSchema(
                type=ChatResponseType.NO_RESULTS,
                message=(
                    f"I found a likely department ({department.value}) but no indexed documents "
                    "currently support an answer."
                ),
                detected_department=department,
                citations=[],
            )
            await self._persist_response(conversation.id, response)
            return response

        llm_provider = get_llm_provider()
        context_excerpts = [chunk.content for chunk, _doc, _score in ranked_hits]
        answer_text = await llm_provider.generate_answer(request.message, context_excerpts, department.value, topic)

        citation_schemas: list[ChatCitationSchema] = []
        seen_documents: set[uuid.UUID] = set()
        for chunk, document, _score in ranked_hits:
            if document.id in seen_documents or len(citation_schemas) >= 3:
                continue
            seen_documents.add(document.id)
            citation_schemas.append(
                ChatCitationSchema(
                    document_id=document.id,
                    document_name=document.filename,
                    department=Department(document.department),
                    page_number=chunk.page_number,
                    excerpt=chunk.content[:280],
                )
            )

        response = ChatResponseSchema(
            type=ChatResponseType.ANSWER,
            message=answer_text,
            detected_department=department,
            detected_topic=topic,
            citations=citation_schemas,
        )
        await self._persist_response(conversation.id, response)
        return response

    async def get_history(self, admin_id: uuid.UUID) -> list[ChatMessageSchema]:
        conversation = await self.conversations.get_or_create_for_admin(admin_id)
        stored_messages = await self.messages.list_for_conversation(conversation.id)

        results: list[ChatMessageSchema] = []
        for message in stored_messages:
            response = None
            if message.role == ChatRole.ASSISTANT:
                citations = await self.citations.list_for_message(message.id)
                response = ChatResponseSchema(
                    type=ChatResponseType(message.response_type) if message.response_type else ChatResponseType.ERROR,
                    message=message.text,
                    detected_department=Department(message.detected_department) if message.detected_department else None,
                    detected_topic=message.detected_topic,
                    citations=[
                        ChatCitationSchema(
                            document_id=c.document_id,
                            document_name=c.document_name,
                            department=Department(c.department),
                            page_number=c.page_number,
                            excerpt=c.excerpt,
                        )
                        for c in citations
                    ]
                    or None,
                    suggestions=[ClarificationSuggestionSchema(**s) for s in message.suggestions]
                    if message.suggestions
                    else None,
                )
            results.append(
                ChatMessageSchema(
                    id=message.id, role=message.role, created_at=message.created_at, text=message.text, response=response
                )
            )
        return results

    async def _detect_department(
        self, request: ChatRequestSchema, indexed_departments: set[str]
    ) -> tuple[Department | None, float]:
        if request.department is not None:
            return request.department, 1.0

        keyword_department, keyword_confidence, keyword_scores = detect_department(request.message)

        llm_provider = get_llm_provider()
        llm_intent = await llm_provider.detect_chat_department_topic(
            request.message, list(indexed_departments), []
        )

        # Candidate departments come only from literal signals (keyword +
        # LLM) — vector search only refines/confirms a candidate that
        # already has some literal support. Letting embedding distribution
        # nominate candidates on its own would let mock-embedding noise
        # (EMBEDDING_PROVIDER=mock isn't semantically meaningful, see
        # providers/embeddings/mock.py) "detect" a department out of thin
        # air for a query with zero real signal, e.g. a single-document
        # corpus always winning by default — making `no_results` unreachable.
        candidate_departments = set(keyword_scores) | {
            Department(d) for d in llm_intent.per_department_scores if llm_intent.per_department_scores[d] > 0
        }
        if not candidate_departments:
            return None, 0.0

        embedding_provider = get_embedding_provider()
        query_vector = await embedding_provider.embed_text(request.message)
        hits = await self._embedding_department_distribution(query_vector)

        # Blend: keyword signal weighted highest since it's the most literal;
        # embedding distribution is mock-noise under EMBEDDING_PROVIDER=mock
        # (documented limitation), so it's weighted low enough not to
        # destabilize an otherwise-confident keyword match on its own.
        blended: dict[Department, float] = {}
        for dept_enum in candidate_departments:
            keyword_score = keyword_scores.get(dept_enum, 0.0)
            llm_score = llm_intent.per_department_scores.get(dept_enum.value, 0.0)
            embedding_score = hits.get(dept_enum, 0.0)
            blended[dept_enum] = 0.6 * keyword_score + 0.25 * llm_score + 0.15 * embedding_score

        top_department = max(blended, key=lambda d: blended[d])
        return top_department, blended[top_department]

    async def _embedding_department_distribution(self, query_vector: list[float]) -> dict[Department, float]:
        from app.modules.documents.repository import DocumentEmbeddingRepository

        hits = await DocumentEmbeddingRepository(self.session).similarity_search(
            query_vector, department=None, category=None, top_k=10
        )
        if not hits:
            return {}
        counts = Counter(Department(doc.department) for _chunk, doc, _dist in hits)
        total = sum(counts.values())
        return {dept: count / total for dept, count in counts.items()}

    async def _confidence_gap(self, message: str, top_department: Department | None, top_confidence: float) -> float:
        if top_department is None:
            return 0.0
        _, _, keyword_scores = detect_department(message)
        others = [score for dept, score in keyword_scores.items() if dept != top_department]
        second_best = max(others) if others else 0.0
        return top_confidence - second_best

    async def _build_suggestions(self, indexed_departments: set[str]) -> list[ClarificationSuggestionSchema]:
        suggestions: list[ClarificationSuggestionSchema] = []
        for dept_value in list(indexed_departments)[:_MAX_SUGGESTIONS]:
            department = Department(dept_value)
            suggestions.append(
                ClarificationSuggestionSchema(
                    label=f"{department.value.replace('_', ' ').title()} topics",
                    department=department,
                    topic="General inquiry",
                )
            )
        return suggestions

    async def _persist_response(self, conversation_id: uuid.UUID, response: ChatResponseSchema) -> None:
        message = await self.messages.add(
            conversation_id=conversation_id,
            role=ChatRole.ASSISTANT,
            text=response.message,
            response_type=response.type.value,
            detected_department=response.detected_department.value if response.detected_department else None,
            detected_topic=response.detected_topic,
            suggestions=[s.model_dump(mode="json") for s in response.suggestions] if response.suggestions else None,
        )
        if response.citations:
            citation_rows = [
                ChatCitation(
                    message_id=message.id,
                    document_id=c.document_id,
                    document_name=c.document_name,
                    department=c.department.value,
                    page_number=c.page_number,
                    excerpt=c.excerpt,
                )
                for c in response.citations
            ]
            await self.citations.bulk_add(citation_rows)
