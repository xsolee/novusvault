import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.service import AdminService
from app.modules.drive.service import DriveService
from app.modules.settings.schemas import AppSettingsSchema


class SettingsService:
    """Composes the frontend-facing GET /settings response live from admin +
    drive state — unlike the frontend mock, which reads a static fixture
    decoupled from live drive-connect mutations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.admin_service = AdminService(session)
        self.drive_service = DriveService(session)

    async def get_app_settings(self, admin_id: uuid.UUID) -> AppSettingsSchema:
        profile = await self.admin_service.get_profile(admin_id)
        drive_status = await self.drive_service.get_status(admin_id)

        return AppSettingsSchema(
            display_name=profile.name,
            google_account_email=drive_status.google_account_email,
            drive_folder_name=drive_status.root_folder.name if drive_status.root_folder else None,
            api_connection_status="ONLINE",
        )
