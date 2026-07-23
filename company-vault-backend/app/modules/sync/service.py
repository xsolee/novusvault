import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.drive.repository import DriveConnectionRepository
from app.modules.sync.models import SyncRun
from app.modules.sync.repository import SyncRunRepository
from app.modules.sync.schemas import SyncRunPageSchema, SyncRunSchema
from app.shared.enums import DriveConnectionState

_TO_SCHEMA_FIELDS = (
    "id",
    "status",
    "stage",
    "started_at",
    "finished_at",
    "total_files",
    "processed_files",
    "success_count",
    "failure_count",
    "current_filename",
    "progress_percent",
)


class SyncService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.runs = SyncRunRepository(session)
        self.connections = DriveConnectionRepository(session)

    async def start_sync(self, admin_id: uuid.UUID) -> SyncRunSchema:
        connection = await self.connections.get_by_admin(admin_id)
        if connection is None or connection.state != DriveConnectionState.CONNECTED:
            raise ConflictError("Connect Google Drive before starting a sync")
        if connection.root_folder_id is None:
            raise ConflictError("Select a Drive folder before starting a sync")

        # Idempotent — a second POST while one is already running returns it
        # instead of starting a duplicate, matching the frontend mock's behavior.
        active = await self.runs.get_active_running(connection.id)
        if active is not None:
            return self._to_schema(active)

        run = await self.runs.create(drive_connection_id=connection.id)

        from app.workers.actors import run_sync_actor

        run_sync_actor.send(str(run.id))

        return self._to_schema(run)

    async def list_runs(self, admin_id: uuid.UUID, *, page: int, page_size: int) -> SyncRunPageSchema:
        connection = await self.connections.get_by_admin(admin_id)
        if connection is None:
            return SyncRunPageSchema(items=[], total=0, page=page, page_size=page_size)

        items, total = await self.runs.list_by_connection_paginated(connection.id, page=page, page_size=page_size)
        return SyncRunPageSchema(
            items=[self._to_schema(run) for run in items], total=total, page=page, page_size=page_size
        )

    async def get_run(self, admin_id: uuid.UUID, run_id: uuid.UUID) -> SyncRunSchema:
        connection = await self.connections.get_by_admin(admin_id)
        run = await self.runs.get_by_id(run_id)
        if run is None or connection is None or run.drive_connection_id != connection.id:
            raise NotFoundError("Sync run not found")
        return self._to_schema(run)

    def _to_schema(self, run: SyncRun) -> SyncRunSchema:
        return SyncRunSchema(**{field: getattr(run, field) for field in _TO_SCHEMA_FIELDS})
