import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import Admin
from app.modules.documents.schemas import (
    DocumentDetailsSchema,
    DocumentFiltersQuery,
    DocumentPageSchema,
    DocumentSummarySchema,
)
from app.modules.documents.service import DocumentService
from app.shared.dependencies import get_current_admin, get_db_session

router = APIRouter()


@router.get("", response_model=DocumentPageSchema)
async def list_documents(
    filters: DocumentFiltersQuery = Depends(),
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> DocumentPageSchema:
    return await DocumentService(session).list_documents(filters)


@router.get("/{document_id}", response_model=DocumentDetailsSchema)
async def get_document(
    document_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> DocumentDetailsSchema:
    return await DocumentService(session).get_details(document_id)


@router.get("/{document_id}/content")
async def get_document_content(
    document_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> RedirectResponse:
    url = await DocumentService(session).get_content_url(document_id)
    return RedirectResponse(url)


@router.post("/{document_id}/reprocess", response_model=DocumentSummarySchema, status_code=202)
async def reprocess_document(
    document_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db_session),
) -> DocumentSummarySchema:
    result = await DocumentService(session).reprocess(document_id)
    await session.commit()
    return result
