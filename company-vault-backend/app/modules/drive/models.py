import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.shared.enums import DriveConnectionState


class DriveConnection(Base):
    """Single admin, single Drive account, single row per admin (MVP: at
    most one admin exists at all, so effectively a singleton table)."""

    __tablename__ = "drive_connections"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admins.id"), unique=True, nullable=False)
    state: Mapped[str] = mapped_column(String, nullable=False, default=DriveConnectionState.NOT_CONNECTED)
    google_account_email: Mapped[str | None] = mapped_column(String, nullable=True)
    google_account_sub: Mapped[str | None] = mapped_column(String, nullable=True)
    access_token_encrypted: Mapped[str | None] = mapped_column(String, nullable=True)
    refresh_token_encrypted: Mapped[str | None] = mapped_column(String, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes: Mapped[str | None] = mapped_column(String, nullable=True)
    # Circular FK to drive_folders — nullable, resolved after both tables exist.
    root_folder_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("drive_folders.id", use_alter=True), nullable=True
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_files_discovered: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_indexed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class DriveFolder(Base):
    """Cache of Drive folders seen via list_folders/select_folder — not a
    full mirror of the admin's Drive, just what's been browsed or selected."""

    __tablename__ = "drive_folders"
    __table_args__ = (UniqueConstraint("drive_connection_id", "google_folder_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    drive_connection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("drive_connections.id"), nullable=False
    )
    google_folder_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    parent_google_folder_id: Mapped[str | None] = mapped_column(String, nullable=True)
    is_root: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    discovered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
