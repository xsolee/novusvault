from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

settings = get_settings()

# IP-based limiting is functionally equivalent to per-admin limiting here —
# the MVP has exactly one admin, so there's no meaningful difference.
limiter = Limiter(key_func=get_remote_address, storage_uri=settings.redis_url)
