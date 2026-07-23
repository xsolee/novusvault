import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.knowledge.models import ChatCitation, ChatConversation, ChatMessage


class ChatConversationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_or_create_for_admin(self, admin_id: uuid.UUID) -> ChatConversation:
        result = await self.session.execute(
            select(ChatConversation).where(ChatConversation.admin_id == admin_id)
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing

        conversation = ChatConversation(admin_id=admin_id)
        self.session.add(conversation)
        await self.session.flush()
        return conversation


class ChatMessageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(
        self,
        *,
        conversation_id: uuid.UUID,
        role: str,
        text: str,
        response_type: str | None = None,
        detected_department: str | None = None,
        detected_topic: str | None = None,
        suggestions: list[dict] | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            text=text,
            response_type=response_type,
            detected_department=detected_department,
            detected_topic=detected_topic,
            suggestions=suggestions,
        )
        self.session.add(message)
        await self.session.flush()
        return message

    async def list_for_conversation(self, conversation_id: uuid.UUID, *, limit: int = 200) -> list[ChatMessage]:
        result = await self.session.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())


class ChatCitationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def bulk_add(self, citations: list[ChatCitation]) -> None:
        self.session.add_all(citations)
        await self.session.flush()

    async def list_for_message(self, message_id: uuid.UUID) -> list[ChatCitation]:
        result = await self.session.execute(
            select(ChatCitation).where(ChatCitation.message_id == message_id)
        )
        return list(result.scalars().all())
