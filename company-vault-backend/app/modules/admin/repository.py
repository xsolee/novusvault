import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import Admin


class AdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, admin_id: uuid.UUID) -> Admin | None:
        return await self.session.get(Admin, admin_id)

    async def get_by_email(self, email: str) -> Admin | None:
        result = await self.session.execute(select(Admin).where(Admin.email == email))
        return result.scalar_one_or_none()

    async def get_by_google_subject(self, subject_id: str) -> Admin | None:
        result = await self.session.execute(select(Admin).where(Admin.google_subject_id == subject_id))
        return result.scalar_one_or_none()

    async def get_sole(self) -> Admin | None:
        """At most one row exists in the MVP; returns it if present."""
        result = await self.session.execute(select(Admin).limit(1))
        return result.scalar_one_or_none()

    async def get_sole_for_update(self) -> Admin | None:
        """Row-locks the sole admin (if any) to avoid a race between two
        concurrent "first login" attempts provisioning duplicate admins."""
        result = await self.session.execute(select(Admin).limit(1).with_for_update())
        return result.scalar_one_or_none()

    async def create(self, *, email: str, name: str, avatar_url: str | None, google_subject_id: str | None) -> Admin:
        admin = Admin(email=email, name=name, avatar_url=avatar_url, google_subject_id=google_subject_id)
        self.session.add(admin)
        await self.session.flush()
        return admin

    async def update_profile(self, admin: Admin, *, name: str, avatar_url: str | None) -> Admin:
        admin.name = name
        admin.avatar_url = avatar_url
        await self.session.flush()
        return admin

    async def count_admins(self) -> int:
        result = await self.session.execute(select(Admin.id))
        return len(result.scalars().all())
