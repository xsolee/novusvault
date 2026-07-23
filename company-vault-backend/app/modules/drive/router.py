from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.modules.admin.models import Admin
from app.modules.drive.schemas import DriveFolderSchema, GoogleDriveConnectionSchema
from app.modules.drive.service import DriveService
from app.shared.dependencies import get_current_admin, get_db_session
from app.shared.schemas import AuthorizationUrlResponse

router = APIRouter()
settings = get_settings()


@router.get("/connect", response_model=AuthorizationUrlResponse)
async def connect(
    admin: Admin = Depends(get_current_admin), session: AsyncSession = Depends(get_db_session)
) -> AuthorizationUrlResponse:
    url = await DriveService(session).build_connect_authorization_url(admin.id)
    await session.commit()
    return AuthorizationUrlResponse(authorization_url=url)


@router.get("/callback")
async def callback(
    code: str = Query(...), state: str = Query(...), session: AsyncSession = Depends(get_db_session)
) -> RedirectResponse:
    # Hit by browser navigation from Google, not axios — the one endpoint in
    # the API that redirects rather than returning JSON.
    try:
        await DriveService(session).handle_connect_callback(code=code, state=state)
        await session.commit()
        return RedirectResponse(f"{settings.frontend_drive_callback_url}?status=connected")
    except Exception:
        await session.rollback()
        return RedirectResponse(f"{settings.frontend_drive_callback_url}?status=failed")


@router.get("/status", response_model=GoogleDriveConnectionSchema)
async def status(
    admin: Admin = Depends(get_current_admin), session: AsyncSession = Depends(get_db_session)
) -> GoogleDriveConnectionSchema:
    return await DriveService(session).get_status(admin.id)


@router.get("/folders", response_model=list[DriveFolderSchema])
async def folders(
    parent_id: str | None = Query(default=None, alias="parentId"),
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> list[DriveFolderSchema]:
    result = await DriveService(session).list_folders(admin.id, parent_id)
    await session.commit()
    return result


@router.post("/select-folder", response_model=GoogleDriveConnectionSchema)
async def select_folder(
    body: DriveFolderSchema,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> GoogleDriveConnectionSchema:
    result = await DriveService(session).select_folder(admin.id, body)
    await session.commit()
    return result


@router.delete("/disconnect", response_model=GoogleDriveConnectionSchema)
async def disconnect(
    admin: Admin = Depends(get_current_admin), session: AsyncSession = Depends(get_db_session)
) -> GoogleDriveConnectionSchema:
    result = await DriveService(session).disconnect(admin.id)
    await session.commit()
    return result
