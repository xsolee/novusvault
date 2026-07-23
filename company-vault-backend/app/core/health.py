from fastapi import APIRouter
from fastapi.responses import JSONResponse
from redis.asyncio import from_url
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import async_session_factory

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/ready")
async def ready() -> JSONResponse:
    checks: dict[str, str] = {}

    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:  # noqa: BLE001
        checks["database"] = f"error: {exc}"

    try:
        redis_client = from_url(settings.redis_url)
        await redis_client.ping()
        await redis_client.aclose()
        checks["redis"] = "ok"
    except Exception as exc:  # noqa: BLE001
        checks["redis"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if all_ok else 503,
        content={"status": "ok" if all_ok else "degraded", "checks": checks},
    )
