from typing import Literal

from app.shared.schemas import CamelModel


class AppSettingsSchema(CamelModel):
    display_name: str
    google_account_email: str | None = None
    drive_folder_name: str | None = None
    api_connection_status: Literal["ONLINE", "OFFLINE"] = "ONLINE"
