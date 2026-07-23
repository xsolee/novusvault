import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sync.models import SyncRun
from app.shared.enums import SyncStage, SyncStatus


class SyncRunRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, drive_connection_id: uuid.UUID, total_files: int = 0) -> SyncRun:
        run = SyncRun(
            drive_connection_id=drive_connection_id,
            status=SyncStatus.RUNNING,
            stage=SyncStage.STARTING,
            started_at=datetime.now(UTC),
            total_files=total_files,
        )
        self.session.add(run)
        await self.session.flush()
        return run

    async def get_by_id(self, run_id: uuid.UUID) -> SyncRun | None:
        return await self.session.get(SyncRun, run_id)

    async def get_active_running(self, drive_connection_id: uuid.UUID) -> SyncRun | None:
        result = await self.session.execute(
            select(SyncRun).where(
                SyncRun.drive_connection_id == drive_connection_id, SyncRun.status == SyncStatus.RUNNING
            )
        )
        return result.scalar_one_or_none()

    async def list_by_connection_paginated(
        self, drive_connection_id: uuid.UUID, *, page: int, page_size: int
    ) -> tuple[list[SyncRun], int]:
        base = select(SyncRun).where(SyncRun.drive_connection_id == drive_connection_id)

        total = (
            await self.session.execute(select(func.count()).select_from(base.subquery()))
        ).scalar_one()

        stmt = base.order_by(SyncRun.started_at.desc()).offset((page - 1) * page_size).limit(page_size)
        items = (await self.session.execute(stmt)).scalars().all()
        return list(items), total

    async def set_total_files(self, run_id: uuid.UUID, total_files: int) -> None:
        await self.session.execute(update(SyncRun).where(SyncRun.id == run_id).values(total_files=total_files))
        await self.session.flush()

    async def update_stage_and_filename(self, run_id: uuid.UUID, stage: SyncStage, filename: str) -> None:
        await self.session.execute(
            update(SyncRun).where(SyncRun.id == run_id).values(stage=stage.value, current_filename=filename)
        )
        await self.session.flush()

    async def atomic_increment(self, run_id: uuid.UUID, *, success: bool) -> None:
        """Single UPDATE ... SET x = x + 1 — avoids a read-modify-write race
        when multiple per-file actor messages complete concurrently."""
        values = {
            "processed_files": SyncRun.processed_files + 1,
            "success_count": SyncRun.success_count + (1 if success else 0),
            "failure_count": SyncRun.failure_count + (0 if success else 1),
        }
        await self.session.execute(update(SyncRun).where(SyncRun.id == run_id).values(**values))
        await self.session.flush()

    async def finalize(self, run_id: uuid.UUID, status: SyncStatus) -> None:
        await self.session.execute(
            update(SyncRun)
            .where(SyncRun.id == run_id)
            .values(
                status=status.value,
                stage=(SyncStage.FAILED if status == SyncStatus.FAILED else SyncStage.COMPLETED).value,
                finished_at=datetime.now(UTC),
                progress_percent=100,
                current_filename=None,
            )
        )
        await self.session.flush()

    async def update_progress_percent(self, run_id: uuid.UUID) -> None:
        run = await self.get_by_id(run_id)
        if run is None or run.total_files == 0:
            return
        percent = min(100, round((run.processed_files / run.total_files) * 100))
        await self.session.execute(update(SyncRun).where(SyncRun.id == run_id).values(progress_percent=percent))
        await self.session.flush()
