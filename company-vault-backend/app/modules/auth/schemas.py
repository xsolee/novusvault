from app.modules.admin.schemas import AdminUserSchema
from app.shared.schemas import CamelModel


class AuthSessionSchema(CamelModel):
    """`refreshToken` is additive beyond the frontend's current `AuthSession`
    TS type (which only has `token`) — the frontend can ignore it today and
    wire it into SecureStore later without any backend change."""

    token: str
    refresh_token: str
    admin: AdminUserSchema


class RefreshRequestSchema(CamelModel):
    refresh_token: str
