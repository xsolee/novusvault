import asyncio
import uuid
from datetime import UTC, datetime, timedelta

import dramatiq
from dramatiq.middleware import CurrentMessage

from app.core.database import async_session_factory
from app.core.security import decrypt_token, encrypt_token
from app.modules.documents.models import Document
from app.modules.documents.pipeline import run_pipeline
from app.modules.documents.repository import DocumentRepository
from app.modules.drive.models import DriveConnection
from app.modules.drive.repository import DriveFolderRepository
from app.modules.sync.repository import SyncRunRepository
from app.providers.drive.google_drive import GoogleDriveConnector
from app.providers.google_oauth import client as google_oauth_client
from app.shared.enums import SyncStage, SyncStatus
from app.workers.broker import broker  # noqa: F401  (registers the Redis broker on import)


async def _get_valid_access_token(session, connection: DriveConnection) -> str:
    """Standalone counterpart to DriveService._get_valid_access_token — the
    worker has no admin_id/HTTP context, only the connection row itself."""
    if connection.token_expires_at and connection.token_expires_at > datetime.now(UTC) + timedelta(minutes=1):
        return decrypt_token(connection.access_token_encrypted)  # type: ignore[arg-type]

    refreshed = await google_oauth_client.refresh_access_token(decrypt_token(connection.refresh_token_encrypted))  # type: ignore[arg-type]
    connection.access_token_encrypted = encrypt_token(refreshed.access_token)
    connection.token_expires_at = datetime.now(UTC) + timedelta(seconds=refreshed.expires_in)
    await session.flush()
    return refreshed.access_token


async def _run_sync_async(sync_run_id: str) -> None:
    run_uuid = uuid.UUID(sync_run_id)

    async with async_session_factory() as session:
        runs_repo = SyncRunRepository(session)
        folders_repo = DriveFolderRepository(session)
        documents_repo = DocumentRepository(session)

        run = await runs_repo.get_by_id(run_uuid)
        if run is None:
            return

        connection = await session.get(DriveConnection, run.drive_connection_id)
        if connection is None or connection.root_folder_id is None:
            await runs_repo.finalize(run_uuid, SyncStatus.FAILED)
            await session.commit()
            return

        try:
            await runs_repo.update_stage_and_filename(run_uuid, SyncStage.DISCOVERING_FILES, "")
            root_folder = await folders_repo.get_by_id(connection.root_folder_id)
            access_token = await _get_valid_access_token(session, connection)
            connector = GoogleDriveConnector(access_token)

            # MVP: files directly inside the selected root folder, non-recursive —
            # matches "one selected root folder, manual sync only" without
            # building full recursive folder-tree traversal.
            remote_files = await connector.list_files(root_folder.google_folder_id)

            documents: list[Document] = []
            for remote_file in remote_files:
                document = await documents_repo.upsert_from_drive_file(
                    drive_connection_id=connection.id,
                    google_file_id=remote_file.file_id,
                    filename=remote_file.name,
                    mime_type=remote_file.mime_type,
                    folder_path=root_folder.path,
                    drive_folder_id=connection.root_folder_id,
                    drive_link=remote_file.web_view_link,
                    size_bytes=remote_file.size_bytes,
                    last_sync_run_id=run_uuid,
                )
                documents.append(document)

            await runs_repo.set_total_files(run_uuid, len(documents))
            await session.commit()

            if not documents:
                async with async_session_factory() as finalize_session:
                    await SyncRunRepository(finalize_session).finalize(run_uuid, SyncStatus.COMPLETED)
                    await finalize_session.commit()
                return

            for document in documents:
                process_document_actor.send(str(document.id), sync_run_id)

        except Exception:  # noqa: BLE001
            await session.rollback()
            async with async_session_factory() as finalize_session:
                await SyncRunRepository(finalize_session).finalize(run_uuid, SyncStatus.FAILED)
                await finalize_session.commit()
            raise


async def _process_document_async(
    document_id: str, sync_run_id: str | None, *, retries_so_far: int, max_retries: int
) -> None:
    doc_uuid = uuid.UUID(document_id)
    run_uuid = uuid.UUID(sync_run_id) if sync_run_id else None

    async with async_session_factory() as session:
        documents_repo = DocumentRepository(session)

        document = await documents_repo.get_by_id(doc_uuid)
        if document is None:
            return
        if document.status == "INDEXED":
            return  # idempotent no-op on a redundant retry/re-enqueue

        await documents_repo.update_status(document, "PROCESSING")
        await session.commit()

        connection = await session.get(DriveConnection, document.drive_connection_id)
        success = False
        try:
            access_token = await _get_valid_access_token(session, connection)  # type: ignore[arg-type]
            connector = GoogleDriveConnector(access_token)
            await run_pipeline(session, document, connector, sync_run_id=run_uuid)
            await session.commit()
            success = True
        except Exception as exc:  # noqa: BLE001
            await session.rollback()
            async with async_session_factory() as error_session:
                error_doc = await DocumentRepository(error_session).get_by_id(doc_uuid)
                if error_doc is not None:
                    await DocumentRepository(error_session).mark_failed(error_doc, str(exc))
                await error_session.commit()

            # Dramatiq's Retries middleware gives up once `retries` already
            # equals max_retries — this failing call is the last one it'll allow.
            is_last_attempt = retries_so_far >= max_retries
            if not is_last_attempt:
                raise  # let Dramatiq's Retries middleware handle backoff + re-raise
        finally:
            if run_uuid and (success or is_last_attempt):
                # Only count on the final outcome, not on every retry attempt.
                async with async_session_factory() as progress_session:
                    runs_repo = SyncRunRepository(progress_session)
                    await runs_repo.atomic_increment(run_uuid, success=success)
                    await runs_repo.update_progress_percent(run_uuid)
                    await progress_session.commit()

                    run = await runs_repo.get_by_id(run_uuid)
                    if run and run.processed_files >= run.total_files:
                        final_status = SyncStatus.COMPLETED if run.failure_count == 0 else SyncStatus.COMPLETED_WITH_ERRORS
                        await runs_repo.finalize(run_uuid, final_status)
                        await progress_session.commit()


@dramatiq.actor(max_retries=3)
def run_sync_actor(sync_run_id: str) -> None:
    asyncio.run(_run_sync_async(sync_run_id))


_MAX_RETRIES = 3


@dramatiq.actor(max_retries=_MAX_RETRIES)
def process_document_actor(document_id: str, sync_run_id: str | None) -> None:
    # CurrentMessage middleware (broker.py) exposes the in-flight message so we
    # can read how many times this job has already been retried (0 on the
    # first attempt). If that count already equals the cap, a failure now
    # means Dramatiq's Retries middleware won't schedule another attempt.
    message = CurrentMessage.get_current_message()
    retries_so_far = message.options.get("retries", 0) if message else 0
    asyncio.run(
        _process_document_async(
            document_id, sync_run_id, retries_so_far=retries_so_far, max_retries=_MAX_RETRIES
        )
    )
