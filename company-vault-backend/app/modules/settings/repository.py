from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.models import ApplicationSettings


class ApplicationSettingsRepository:
    """Backend-internal tunables (chat thresholds, chunk size) — currently
    seeded from env config (app/core/config.py) at each read site rather than
    this table; the table exists so a future admin-facing settings screen can
    persist overrides without a schema change. No endpoint reads/writes it yet."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_singleton(self) -> ApplicationSettings | None:
        result = await self.session.execute(select(ApplicationSettings).limit(1))
        return result.scalar_one_or_none()

    async def get_or_create_singleton(self) -> ApplicationSettings:
        existing = await self.get_singleton()
        if existing is not None:
            return existing
        settings_row = ApplicationSettings()
        self.session.add(settings_row)
        await self.session.flush()
        return settings_row

    async def update(self, settings_row: ApplicationSettings, **fields) -> ApplicationSettings:
        for key, value in fields.items():
            setattr(settings_row, key, value)
        await self.session.flush()
        return settings_row
