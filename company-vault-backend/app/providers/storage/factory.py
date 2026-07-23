from functools import lru_cache

from app.providers.storage.minio_provider import MinIOStorageProvider


@lru_cache
def get_storage_provider() -> MinIOStorageProvider:
    return MinIOStorageProvider()
