import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import decrypt_token, encrypt_token, generate_oauth_state, generate_pkce_pair
from app.modules.auth.repository import OAuthStateRepository
from app.modules.drive.models import DriveConnection
from app.modules.drive.repository import DriveConnectionRepository, DriveFolderRepository
from app.modules.drive.schemas import DriveFolderSchema, GoogleDriveConnectionSchema
from app.providers.drive.google_drive import GoogleDriveConnector
from app.providers.google_oauth import client as google_oauth_client
from app.shared.enums import DriveConnectionState, OAuthFlowType

settings = get_settings()

_STATE_TTL_MINUTES = 10
_DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


class DriveService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.connections = DriveConnectionRepository(session)
        self.folders = DriveFolderRepository(session)
        self.oauth_states = OAuthStateRepository(session)

    async def get_status(self, admin_id: uuid.UUID) -> GoogleDriveConnectionSchema:
        connection = await self.connections.get_by_admin(admin_id)
        if connection is None:
            return GoogleDriveConnectionSchema(
                state=DriveConnectionState.NOT_CONNECTED,
                total_files_discovered=0,
                total_indexed=0,
                total_failed=0,
            )
        return await self._to_schema(connection)

    async def build_connect_authorization_url(self, admin_id: uuid.UUID) -> str:
        state = generate_oauth_state()
        code_verifier, code_challenge = generate_pkce_pair()

        await self.oauth_states.create(
            state=state,
            code_verifier=code_verifier,
            flow_type=OAuthFlowType.DRIVE_CONNECT,
            redirect_uri=settings.google_drive_redirect_uri,
            expires_at=datetime.now(UTC) + timedelta(minutes=_STATE_TTL_MINUTES),
            admin_id=admin_id,
        )

        return google_oauth_client.build_authorization_url(
            scopes=_DRIVE_SCOPES,
            redirect_uri=settings.google_drive_redirect_uri,
            state=state,
            code_challenge=code_challenge,
        )

    async def handle_connect_callback(self, *, code: str, state: str) -> None:
        oauth_state = await self.oauth_states.get_valid_by_state(state, OAuthFlowType.DRIVE_CONNECT)
        if oauth_state is None or oauth_state.admin_id is None:
            raise UnauthorizedError("Invalid or expired Drive connection request")
        await self.oauth_states.mark_consumed(oauth_state)

        connection = await self.connections.get_or_create(oauth_state.admin_id)

        try:
            tokens = await google_oauth_client.exchange_code(
                code=code, code_verifier=oauth_state.code_verifier, redirect_uri=oauth_state.redirect_uri
            )
            identity = (
                google_oauth_client.verify_id_token(tokens.id_token) if tokens.id_token else None
            )
            await self.connections.mark_connected(
                connection,
                google_account_email=identity.email if identity else "",
                google_account_sub=identity.subject_id if identity else "",
                access_token_encrypted=encrypt_token(tokens.access_token),
                refresh_token_encrypted=encrypt_token(tokens.refresh_token) if tokens.refresh_token else None,
                token_expires_at=datetime.now(UTC) + timedelta(seconds=tokens.expires_in),
                scopes=tokens.scope,
            )
        except Exception:
            await self.connections.mark_failed(connection)
            raise

    async def list_folders(self, admin_id: uuid.UUID, parent_id: str | None) -> list[DriveFolderSchema]:
        connection = await self.connections.get_by_admin(admin_id)
        if connection is None or connection.state != DriveConnectionState.CONNECTED:
            raise ConflictError("Google Drive is not connected")

        access_token = await self._get_valid_access_token(connection)
        connector = GoogleDriveConnector(access_token)
        remote_folders = await connector.list_folders(parent_id)

        results: list[DriveFolderSchema] = []
        for folder in remote_folders:
            await self.folders.upsert_cached(
                connection_id=connection.id,
                google_folder_id=folder.folder_id,
                name=folder.name,
                path=folder.path,
                parent_google_folder_id=folder.parent_folder_id,
            )
            results.append(
                DriveFolderSchema(
                    id=folder.folder_id, name=folder.name, path=folder.path, parent_id=folder.parent_folder_id
                )
            )
        return results

    async def select_folder(self, admin_id: uuid.UUID, folder: DriveFolderSchema) -> GoogleDriveConnectionSchema:
        connection = await self.connections.get_by_admin(admin_id)
        if connection is None or connection.state != DriveConnectionState.CONNECTED:
            raise ConflictError("Google Drive is not connected")

        cached = await self.folders.upsert_cached(
            connection_id=connection.id,
            google_folder_id=folder.id,
            name=folder.name,
            path=folder.path,
            parent_google_folder_id=folder.parent_id,
        )
        await self.folders.set_root(cached)
        await self.connections.set_root_folder(connection, cached.id)

        return await self._to_schema(connection)

    async def disconnect(self, admin_id: uuid.UUID) -> GoogleDriveConnectionSchema:
        connection = await self.connections.get_by_admin(admin_id)
        if connection is None:
            return GoogleDriveConnectionSchema(
                state=DriveConnectionState.NOT_CONNECTED,
                total_files_discovered=0,
                total_indexed=0,
                total_failed=0,
            )

        # Best-effort revoke; a failed revoke shouldn't block the local disconnect.
        if connection.access_token_encrypted:
            try:
                import httpx

                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(
                        "https://oauth2.googleapis.com/revoke",
                        params={"token": decrypt_token(connection.access_token_encrypted)},
                    )
            except Exception:  # noqa: BLE001
                pass

        connection = await self.connections.reset_to_disconnected(connection)
        return await self._to_schema(connection)

    async def _get_valid_access_token(self, connection: DriveConnection) -> str:
        if connection.token_expires_at and connection.token_expires_at > datetime.now(UTC) + timedelta(
            minutes=1
        ):
            return decrypt_token(connection.access_token_encrypted)  # type: ignore[arg-type]

        if not connection.refresh_token_encrypted:
            raise UnauthorizedError("Google Drive connection has expired; please reconnect")

        refreshed = await google_oauth_client.refresh_access_token(decrypt_token(connection.refresh_token_encrypted))
        connection.access_token_encrypted = encrypt_token(refreshed.access_token)
        connection.token_expires_at = datetime.now(UTC) + timedelta(seconds=refreshed.expires_in)
        await self.session.flush()
        return refreshed.access_token

    async def _to_schema(self, connection: DriveConnection) -> GoogleDriveConnectionSchema:
        root_folder = None
        if connection.root_folder_id is not None:
            folder = await self.folders.get_by_id(connection.root_folder_id)
            if folder is not None:
                root_folder = DriveFolderSchema(
                    id=folder.google_folder_id,
                    name=folder.name,
                    path=folder.path,
                    parent_id=folder.parent_google_folder_id,
                )

        return GoogleDriveConnectionSchema(
            state=DriveConnectionState(connection.state),
            google_account_email=connection.google_account_email,
            root_folder=root_folder,
            last_synced_at=connection.last_synced_at,
            total_files_discovered=connection.total_files_discovered,
            total_indexed=connection.total_indexed,
            total_failed=connection.total_failed,
        )
