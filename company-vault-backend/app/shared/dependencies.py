import uuid

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.modules.admin.models import Admin
from app.modules.admin.repository import AdminRepository

_bearer_scheme = HTTPBearer(auto_error=False)

__all__ = ["get_db_session", "get_current_admin"]


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_db_session),
) -> Admin:
    if credentials is None:
        raise UnauthorizedError("Missing bearer token")

    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Invalid or expired token") from exc

    try:
        admin_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise UnauthorizedError("Invalid token payload") from exc

    admin = await AdminRepository(session).get_by_id(admin_id)
    if admin is None:
        raise UnauthorizedError("Admin no longer exists")

    return admin
