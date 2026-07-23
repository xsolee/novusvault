from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db_session() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        yield session


def import_all_models() -> None:
    """Import every module's models.py so Base.metadata is complete before
    Alembic autogenerate runs. Called from migrations/env.py."""
    from app.modules.admin import models as _admin_models  # noqa: F401
    from app.modules.auth import models as _auth_models  # noqa: F401
    from app.modules.documents import models as _documents_models  # noqa: F401
    from app.modules.drive import models as _drive_models  # noqa: F401
    from app.modules.knowledge import models as _knowledge_models  # noqa: F401
    from app.modules.settings import models as _settings_models  # noqa: F401
    from app.modules.sync import models as _sync_models  # noqa: F401
