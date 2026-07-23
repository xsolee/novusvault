import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import AuthSession, GoogleOAuthState
from app.shared.enums import OAuthFlowType


class AuthSessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        admin_id: uuid.UUID,
        refresh_token_hash: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthSession:
        auth_session = AuthSession(
            admin_id=admin_id,
            refresh_token_hash=refresh_token_hash,
            issued_at=datetime.now(UTC),
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.session.add(auth_session)
        await self.session.flush()
        return auth_session

    async def get_by_refresh_hash(self, refresh_token_hash: str) -> AuthSession | None:
        result = await self.session.execute(
            select(AuthSession).where(
                AuthSession.refresh_token_hash == refresh_token_hash,
                AuthSession.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def revoke(self, auth_session: AuthSession) -> None:
        auth_session.revoked_at = datetime.now(UTC)
        await self.session.flush()

    async def revoke_all_for_admin(self, admin_id: uuid.UUID) -> None:
        result = await self.session.execute(
            select(AuthSession).where(AuthSession.admin_id == admin_id, AuthSession.revoked_at.is_(None))
        )
        for auth_session in result.scalars().all():
            auth_session.revoked_at = datetime.now(UTC)
        await self.session.flush()


class OAuthStateRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        state: str,
        code_verifier: str,
        flow_type: OAuthFlowType,
        redirect_uri: str,
        expires_at: datetime,
        admin_id: uuid.UUID | None = None,
    ) -> GoogleOAuthState:
        oauth_state = GoogleOAuthState(
            state=state,
            code_verifier=code_verifier,
            flow_type=flow_type,
            redirect_uri=redirect_uri,
            admin_id=admin_id,
            expires_at=expires_at,
        )
        self.session.add(oauth_state)
        await self.session.flush()
        return oauth_state

    async def get_valid_by_state(self, state: str, flow_type: OAuthFlowType) -> GoogleOAuthState | None:
        result = await self.session.execute(
            select(GoogleOAuthState).where(
                GoogleOAuthState.state == state,
                GoogleOAuthState.flow_type == flow_type,
                GoogleOAuthState.consumed_at.is_(None),
                GoogleOAuthState.expires_at > datetime.now(UTC),
            )
        )
        return result.scalar_one_or_none()

    async def mark_consumed(self, oauth_state: GoogleOAuthState) -> None:
        oauth_state.consumed_at = datetime.now(UTC)
        await self.session.flush()
