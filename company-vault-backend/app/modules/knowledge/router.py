from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.modules.admin.models import Admin
from app.modules.knowledge.schemas import ChatMessageSchema, ChatRequestSchema, ChatResponseSchema
from app.modules.knowledge.service import KnowledgeService
from app.shared.dependencies import get_current_admin, get_db_session

router = APIRouter()
settings = get_settings()


@router.post("", response_model=ChatResponseSchema)
@limiter.limit(settings.chat_rate_limit)
async def send_chat_message(
    request: Request,
    body: ChatRequestSchema,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> ChatResponseSchema:
    result = await KnowledgeService(session).handle_chat(admin.id, body)
    await session.commit()
    return result


@router.get("/history", response_model=list[ChatMessageSchema])
async def get_chat_history(
    admin: Admin = Depends(get_current_admin), session: AsyncSession = Depends(get_db_session)
) -> list[ChatMessageSchema]:
    return await KnowledgeService(session).get_history(admin.id)
