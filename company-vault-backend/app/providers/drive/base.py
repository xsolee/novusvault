from dataclasses import dataclass
from typing import Protocol


@dataclass
class DriveFileMetadata:
    file_id: str
    name: str
    mime_type: str
    size_bytes: int | None
    folder_path: str
    parent_folder_id: str | None
    web_view_link: str | None


@dataclass
class DriveFolderMetadata:
    folder_id: str
    name: str
    path: str
    parent_folder_id: str | None


class SourceConnector(Protocol):
    """Ingestion sources are behind this protocol so future sources (Sheets,
    S3, upload, OneDrive, SharePoint, Gmail) can be added later without
    touching the sync/documents pipeline. MVP implements only GoogleDriveConnector."""

    async def list_files(self, folder_id: str) -> list[DriveFileMetadata]: ...

    async def download_file(self, file_id: str) -> bytes: ...

    async def get_file_metadata(self, file_id: str) -> DriveFileMetadata: ...

    async def list_folders(self, parent_id: str | None) -> list[DriveFolderMetadata]: ...
