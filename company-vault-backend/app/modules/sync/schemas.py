import uuid
from datetime import datetime

from app.shared.enums import SyncStage, SyncStatus
from app.shared.schemas import CamelModel


class SyncRunSchema(CamelModel):
    id: uuid.UUID
    status: SyncStatus
    stage: SyncStage
    started_at: datetime
    finished_at: datetime | None = None
    total_files: int
    processed_files: int
    success_count: int
    failure_count: int
    current_filename: str | None = None
    progress_percent: int


class SyncRunPageSchema(CamelModel):
    items: list[SyncRunSchema]
    total: int
    page: int
    page_size: int
