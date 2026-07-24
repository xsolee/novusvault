from functools import lru_cache

from app.providers.storage.minio_provider import S3StorageProvider


@lru_cache
def get_storage_provider() -> S3StorageProvider:
    return S3StorageProvider()
