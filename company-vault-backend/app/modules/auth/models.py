import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.shared.enums import OAuthFlowType


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admins.id"), nullable=False)
    refresh_token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GoogleOAuthState(Base):
    __tablename__ = "google_oauth_states"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    state: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    code_verifier: Mapped[str] = mapped_column(String, nullable=False)
    flow_type: Mapped[OAuthFlowType] = mapped_column(String, nullable=False)
    redirect_uri: Mapped[str] = mapped_column(String, nullable=False)
    # Null for LOGIN (admin isn't known yet); set for DRIVE_CONNECT at /drive/connect
    # time, since the browser hitting /drive/callback carries no Bearer header.
    admin_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
