import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ApplicationSettings(Base):
    """Single-row table of backend-internal tunables (chat thresholds, chunk
    size). Distinct from AppSettingsSchema, the frontend-facing GET /settings
    response composed live from admin + drive state in settings/service.py."""

    __tablename__ = "application_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    chat_department_confidence_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0.65)
    chat_department_gap_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0.15)
    chunk_size_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=800)
    chunk_overlap_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=150)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
