from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.health import router as health_router
from app.core.logging import configure_logging
from app.core.rate_limit import limiter

settings = get_settings()


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(title="Company Vault API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    register_exception_handlers(app)

    # Unprefixed: GET /health, GET /ready
    app.include_router(health_router)

    # Module routers are mounted here as they're built (see plan build order).
    from app.modules.admin.router import router as admin_router
    from app.modules.auth.router import router as auth_router
    from app.modules.documents.router import router as documents_router
    from app.modules.drive.router import router as drive_router
    from app.modules.knowledge.router import router as knowledge_router
    from app.modules.settings.router import router as settings_router
    from app.modules.sync.router import router as sync_router

    app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
    app.include_router(drive_router, prefix="/api/v1/drive", tags=["drive"])
    app.include_router(sync_router, prefix="/api/v1/sync", tags=["sync"])
    app.include_router(documents_router, prefix="/api/v1/documents", tags=["documents"])
    app.include_router(knowledge_router, prefix="/api/v1/chat", tags=["knowledge"])
    app.include_router(settings_router, prefix="/api/v1/settings", tags=["settings"])

    return app


app = create_app()
