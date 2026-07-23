import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ForbiddenError, NotFoundError
from app.modules.admin.models import Admin
from app.modules.admin.repository import AdminRepository
from app.modules.admin.schemas import AdminUserSchema

settings = get_settings()


@dataclass
class GoogleProfile:
    """Identity claims from either a real Google ID token or the dev-login
    bypass — provisioning logic treats both uniformly."""

    email: str
    name: str
    avatar_url: str | None
    subject_id: str | None


class AdminService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = AdminRepository(session)

    async def get_profile(self, admin_id: uuid.UUID) -> AdminUserSchema:
        admin = await self.repository.get_by_id(admin_id)
        if admin is None:
            raise NotFoundError("Admin not found")
        return AdminUserSchema.model_validate(admin)

    async def provision_or_authenticate(self, profile: GoogleProfile) -> Admin:
        """First successful login (real Google or dev-bypass) provisions the
        sole admin row. Any other identity attempting to log in afterward is
        rejected — exactly one ADMIN exists in the MVP, no invitations."""
        if settings.admin_allowed_email and profile.email.lower() != settings.admin_allowed_email.lower():
            raise ForbiddenError("This Google account is not authorized for Company Vault.")

        existing = await self.repository.get_sole_for_update()

        if existing is None:
            return await self.repository.create(
                email=profile.email,
                name=profile.name,
                avatar_url=profile.avatar_url,
                google_subject_id=profile.subject_id,
            )

        identity_matches = (
            profile.subject_id is not None and existing.google_subject_id == profile.subject_id
        ) or existing.email.lower() == profile.email.lower()

        if not identity_matches:
            raise ForbiddenError("Company Vault already has a registered administrator.")

        return await self.repository.update_profile(existing, name=profile.name, avatar_url=profile.avatar_url)
