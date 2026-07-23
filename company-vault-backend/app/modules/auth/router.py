from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.modules.admin.models import Admin
from app.modules.admin.schemas import AdminUserSchema
from app.modules.auth.schemas import AuthSessionSchema, RefreshRequestSchema
from app.modules.auth.service import AuthService
from app.shared.dependencies import get_current_admin, get_db_session
from app.shared.schemas import AuthorizationUrlResponse

router = APIRouter()
settings = get_settings()


@router.get("/google/login", response_model=AuthorizationUrlResponse)
async def google_login(session: AsyncSession = Depends(get_db_session)) -> AuthorizationUrlResponse:
    url = await AuthService(session).build_login_authorization_url()
    await session.commit()
    return AuthorizationUrlResponse(authorization_url=url)


@router.get("/google/callback", response_model=AuthSessionSchema)
async def google_callback(
    code: str = Query(...), state: str = Query(...), session: AsyncSession = Depends(get_db_session)
) -> AuthSessionSchema:
    result = await AuthService(session).handle_login_callback(code=code, state=state)
    await session.commit()
    return result


@router.post("/refresh", response_model=AuthSessionSchema)
async def refresh(
    body: RefreshRequestSchema, session: AsyncSession = Depends(get_db_session)
) -> AuthSessionSchema:
    result = await AuthService(session).refresh(body.refresh_token)
    await session.commit()
    return result


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    admin: Admin = Depends(get_current_admin), session: AsyncSession = Depends(get_db_session)
) -> None:
    await AuthService(session).logout(admin.id)
    await session.commit()


@router.get("/me", response_model=AdminUserSchema)
async def me(admin: Admin = Depends(get_current_admin)) -> AdminUserSchema:
    return AdminUserSchema.model_validate(admin)


if settings.dev_login_active:

    @router.post("/dev-login", response_model=AuthSessionSchema)
    async def dev_login(session: AsyncSession = Depends(get_db_session)) -> AuthSessionSchema:
        result = await AuthService(session).dev_login()
        await session.commit()
        return result
