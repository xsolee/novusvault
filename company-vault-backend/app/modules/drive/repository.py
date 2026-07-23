import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.drive.models import DriveConnection, DriveFolder
from app.shared.enums import DriveConnectionState


class DriveConnectionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_admin(self, admin_id: uuid.UUID) -> DriveConnection | None:
        result = await self.session.execute(
            select(DriveConnection).where(DriveConnection.admin_id == admin_id)
        )
        return result.scalar_one_or_none()

    async def get_by_admin_with_root_folder(self, admin_id: uuid.UUID) -> DriveConnection | None:
        # root_folder is loaded lazily via awaitable attrs at read time by the caller;
        # kept as a thin alias so call sites read clearly.
        return await self.get_by_admin(admin_id)

    async def get_or_create(self, admin_id: uuid.UUID) -> DriveConnection:
        existing = await self.get_by_admin(admin_id)
        if existing is not None:
            return existing
        connection = DriveConnection(admin_id=admin_id, state=DriveConnectionState.NOT_CONNECTED)
        self.session.add(connection)
        await self.session.flush()
        return connection

    async def mark_connected(
        self,
        connection: DriveConnection,
        *,
        google_account_email: str,
        google_account_sub: str,
        access_token_encrypted: str,
        refresh_token_encrypted: str | None,
        token_expires_at: datetime,
        scopes: str,
    ) -> DriveConnection:
        connection.state = DriveConnectionState.CONNECTED
        connection.google_account_email = google_account_email
        connection.google_account_sub = google_account_sub
        connection.access_token_encrypted = access_token_encrypted
        if refresh_token_encrypted is not None:
            connection.refresh_token_encrypted = refresh_token_encrypted
        connection.token_expires_at = token_expires_at
        connection.scopes = scopes
        await self.session.flush()
        return connection

    async def mark_failed(self, connection: DriveConnection) -> DriveConnection:
        connection.state = DriveConnectionState.FAILED
        await self.session.flush()
        return connection

    async def set_root_folder(self, connection: DriveConnection, folder_id: uuid.UUID) -> DriveConnection:
        connection.root_folder_id = folder_id
        await self.session.flush()
        return connection

    async def reset_to_disconnected(self, connection: DriveConnection) -> DriveConnection:
        connection.state = DriveConnectionState.NOT_CONNECTED
        connection.google_account_email = None
        connection.google_account_sub = None
        connection.access_token_encrypted = None
        connection.refresh_token_encrypted = None
        connection.token_expires_at = None
        connection.scopes = None
        connection.root_folder_id = None
        connection.last_synced_at = None
        connection.total_files_discovered = 0
        connection.total_indexed = 0
        connection.total_failed = 0
        await self.session.flush()
        return connection


class DriveFolderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, folder_id: uuid.UUID) -> DriveFolder | None:
        return await self.session.get(DriveFolder, folder_id)

    async def get_by_google_id(
        self, connection_id: uuid.UUID, google_folder_id: str
    ) -> DriveFolder | None:
        result = await self.session.execute(
            select(DriveFolder).where(
                DriveFolder.drive_connection_id == connection_id,
                DriveFolder.google_folder_id == google_folder_id,
            )
        )
        return result.scalar_one_or_none()

    async def upsert_cached(
        self,
        *,
        connection_id: uuid.UUID,
        google_folder_id: str,
        name: str,
        path: str,
        parent_google_folder_id: str | None,
    ) -> DriveFolder:
        existing = await self.get_by_google_id(connection_id, google_folder_id)
        if existing is not None:
            existing.name = name
            existing.path = path
            existing.parent_google_folder_id = parent_google_folder_id
            await self.session.flush()
            return existing

        folder = DriveFolder(
            drive_connection_id=connection_id,
            google_folder_id=google_folder_id,
            name=name,
            path=path,
            parent_google_folder_id=parent_google_folder_id,
        )
        self.session.add(folder)
        await self.session.flush()
        return folder

    async def set_root(self, folder: DriveFolder) -> DriveFolder:
        folder.is_root = True
        await self.session.flush()
        return folder
