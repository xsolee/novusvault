import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    generate_oauth_state,
    generate_pkce_pair,
    generate_refresh_token,
    hash_refresh_token,
    refresh_token_expiry,
)
from app.modules.admin.service import AdminService, GoogleProfile
from app.modules.auth.repository import AuthSessionRepository, OAuthStateRepository
from app.modules.auth.schemas import AuthSessionSchema
from app.providers.google_oauth import client as google_oauth_client
from app.shared.enums import OAuthFlowType

settings = get_settings()

_STATE_TTL_MINUTES = 10
_LOGIN_SCOPES = ["openid", "email", "profile"]


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.auth_sessions = AuthSessionRepository(session)
        self.oauth_states = OAuthStateRepository(session)
        self.admin_service = AdminService(session)

    async def build_login_authorization_url(self) -> str:
        state = generate_oauth_state()
        code_verifier, code_challenge = generate_pkce_pair()

        await self.oauth_states.create(
            state=state,
            code_verifier=code_verifier,
            flow_type=OAuthFlowType.LOGIN,
            redirect_uri=settings.google_login_redirect_uri,
            expires_at=datetime.now(UTC) + timedelta(minutes=_STATE_TTL_MINUTES),
        )

        return google_oauth_client.build_authorization_url(
            scopes=_LOGIN_SCOPES,
            redirect_uri=settings.google_login_redirect_uri,
            state=state,
            code_challenge=code_challenge,
        )

    async def handle_login_callback(self, *, code: str, state: str) -> AuthSessionSchema:
        oauth_state = await self.oauth_states.get_valid_by_state(state, OAuthFlowType.LOGIN)
        if oauth_state is None:
            raise UnauthorizedError("Invalid or expired sign-in request")
        await self.oauth_states.mark_consumed(oauth_state)

        tokens = await google_oauth_client.exchange_code(
            code=code, code_verifier=oauth_state.code_verifier, redirect_uri=oauth_state.redirect_uri
        )
        if tokens.id_token is None:
            raise UnauthorizedError("Google did not return an identity token")

        identity = google_oauth_client.verify_id_token(tokens.id_token)
        profile = GoogleProfile(
            email=identity.email, name=identity.name, avatar_url=identity.picture, subject_id=identity.subject_id
        )
        admin = await self.admin_service.provision_or_authenticate(profile)

        return await self._issue_session(admin.id, admin.email)

    async def dev_login(self) -> AuthSessionSchema:
        """Guarded entirely at the router level (route only registered when
        settings.dev_login_active) — this method has no guard of its own so
        it can be reused/tested directly without depending on request state."""
        profile = GoogleProfile(
            email=settings.dev_admin_email, name=settings.dev_admin_name, avatar_url=None, subject_id=None
        )
        admin = await self.admin_service.provision_or_authenticate(profile)
        return await self._issue_session(admin.id, admin.email)

    async def refresh(self, refresh_token: str) -> AuthSessionSchema:
        token_hash = hash_refresh_token(refresh_token)
        existing = await self.auth_sessions.get_by_refresh_hash(token_hash)
        if existing is None or existing.expires_at < datetime.now(UTC):
            raise UnauthorizedError("Refresh token is invalid or expired")

        admin = await self.admin_service.repository.get_by_id(existing.admin_id)
        if admin is None:
            raise UnauthorizedError("Admin no longer exists")

        await self.auth_sessions.revoke(existing)
        return await self._issue_session(admin.id, admin.email)

    async def logout(self, admin_id: uuid.UUID) -> None:
        await self.auth_sessions.revoke_all_for_admin(admin_id)

    async def _issue_session(self, admin_id: uuid.UUID, email: str) -> AuthSessionSchema:
        access_token = create_access_token(admin_id=admin_id, email=email)
        refresh_token = generate_refresh_token()

        await self.auth_sessions.create(
            admin_id=admin_id,
            refresh_token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_token_expiry(),
        )

        admin_schema = await self.admin_service.get_profile(admin_id)
        return AuthSessionSchema(token=access_token, refresh_token=refresh_token, admin=admin_schema)
