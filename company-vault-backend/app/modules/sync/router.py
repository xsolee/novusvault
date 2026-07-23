import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import Admin
from app.modules.sync.schemas import SyncRunPageSchema, SyncRunSchema
from app.modules.sync.service import SyncService
from app.shared.dependencies import get_current_admin, get_db_session

router = APIRouter()


@router.post("", response_model=SyncRunSchema, status_code=202)
async def start_sync(
    admin: Admin = Depends(get_current_admin), session: AsyncSession = Depends(get_db_session)
) -> SyncRunSchema:
    result = await SyncService(session).start_sync(admin.id)
    await session.commit()
    return result


@router.get("", response_model=SyncRunPageSchema)
async def list_sync_runs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100, alias="pageSize"),
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> SyncRunPageSchema:
    return await SyncService(session).list_runs(admin.id, page=page, page_size=page_size)


@router.get("/{sync_run_id}", response_model=SyncRunSchema)
async def get_sync_run(
    sync_run_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> SyncRunSchema:
    return await SyncService(session).get_run(admin.id, sync_run_id)
