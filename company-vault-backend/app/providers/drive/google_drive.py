import httpx

from app.providers.drive.base import DriveFileMetadata, DriveFolderMetadata

_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files"
_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"
# Native Google Docs/Sheets/Slides have no binary content — export to a
# broadly-extractable format instead of alt=media (which 403s on them).
_EXPORT_MIME_MAP = {
    "application/vnd.google-apps.document": "application/pdf",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "application/pdf",
}


class GoogleDriveConnector:
    """Real SourceConnector implementation, scoped to `drive.readonly`.
    Constructed with an already-fresh access token — token refresh is
    DriveService's responsibility (it persists the refreshed token), not
    this connector's, keeping the connector itself stateless per-call."""

    def __init__(self, access_token: str) -> None:
        self._access_token = access_token

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._access_token}"}

    async def list_files(self, folder_id: str) -> list[DriveFileMetadata]:
        query = f"'{folder_id}' in parents and trashed = false and mimeType != '{_FOLDER_MIME_TYPE}'"
        async with httpx.AsyncClient(timeout=30.0) as client:
            files: list[DriveFileMetadata] = []
            page_token: str | None = None
            while True:
                params = {
                    "q": query,
                    "fields": "nextPageToken, files(id,name,mimeType,size,parents,webViewLink)",
                    "pageSize": 200,
                }
                if page_token:
                    params["pageToken"] = page_token
                response = await client.get(_FILES_ENDPOINT, headers=self._headers(), params=params)
                response.raise_for_status()
                data = response.json()
                for item in data.get("files", []):
                    files.append(
                        DriveFileMetadata(
                            file_id=item["id"],
                            name=item["name"],
                            mime_type=item["mimeType"],
                            size_bytes=int(item["size"]) if "size" in item else None,
                            folder_path="",  # filled in by the caller, which knows the folder tree
                            parent_folder_id=folder_id,
                            web_view_link=item.get("webViewLink"),
                        )
                    )
                page_token = data.get("nextPageToken")
                if not page_token:
                    break
        return files

    async def download_file(self, file_id: str) -> bytes:
        metadata = await self.get_file_metadata(file_id)
        async with httpx.AsyncClient(timeout=120.0) as client:
            export_mime = _EXPORT_MIME_MAP.get(metadata.mime_type)
            if export_mime:
                url = f"{_FILES_ENDPOINT}/{file_id}/export"
                params = {"mimeType": export_mime}
            else:
                url = f"{_FILES_ENDPOINT}/{file_id}"
                params = {"alt": "media"}
            response = await client.get(url, headers=self._headers(), params=params)
            response.raise_for_status()
            return response.content

    async def get_file_metadata(self, file_id: str) -> DriveFileMetadata:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{_FILES_ENDPOINT}/{file_id}",
                headers=self._headers(),
                params={"fields": "id,name,mimeType,size,parents,webViewLink"},
            )
            response.raise_for_status()
            item = response.json()
        return DriveFileMetadata(
            file_id=item["id"],
            name=item["name"],
            mime_type=item["mimeType"],
            size_bytes=int(item["size"]) if "size" in item else None,
            folder_path="",
            parent_folder_id=(item.get("parents") or [None])[0],
            web_view_link=item.get("webViewLink"),
        )

    async def list_folders(self, parent_id: str | None) -> list[DriveFolderMetadata]:
        parent = parent_id or "root"
        query = f"'{parent}' in parents and trashed = false and mimeType = '{_FOLDER_MIME_TYPE}'"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                _FILES_ENDPOINT,
                headers=self._headers(),
                params={"q": query, "fields": "files(id,name,parents)", "pageSize": 200},
            )
            response.raise_for_status()
            data = response.json()
        return [
            DriveFolderMetadata(
                folder_id=item["id"],
                name=item["name"],
                path=item["name"],  # caller composes the full path from the browsed chain
                parent_folder_id=parent_id,
            )
            for item in data.get("files", [])
        ]
