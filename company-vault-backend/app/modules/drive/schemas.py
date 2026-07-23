from datetime import datetime

from app.shared.enums import DriveConnectionState
from app.shared.schemas import CamelModel


class DriveFolderSchema(CamelModel):
    """`id`/`parent_id` are Google Drive folder IDs (strings), not internal
    UUIDs — matches the frontend contract 1:1, no translation layer in the UI."""

    id: str
    name: str
    path: str
    parent_id: str | None


class GoogleDriveConnectionSchema(CamelModel):
    state: DriveConnectionState
    google_account_email: str | None = None
    root_folder: DriveFolderSchema | None = None
    last_synced_at: datetime | None = None
    total_files_discovered: int
    total_indexed: int
    total_failed: int
