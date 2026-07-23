from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import Admin
from app.modules.settings.schemas import AppSettingsSchema
from app.modules.settings.service import SettingsService
from app.shared.dependencies import get_current_admin, get_db_session

router = APIRouter()


@router.get("", response_model=AppSettingsSchema)
async def get_settings_endpoint(
    admin: Admin = Depends(get_current_admin), session: AsyncSession = Depends(get_db_session)
) -> AppSettingsSchema:
    return await SettingsService(session).get_app_settings(admin.id)
