import uuid

from app.shared.schemas import CamelModel


class AdminUserSchema(CamelModel):
    id: uuid.UUID
    name: str
    email: str
    avatar_url: str | None = None
