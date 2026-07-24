import aioboto3
from botocore.config import Config

from app.core.config import get_settings

settings = get_settings()


class S3StorageProvider:
    """Real S3-compatible implementation — Supabase Storage by default config, but works
    against any S3-compatible endpoint (including a local MinIO for offline dev) via the same
    env vars. Unlike llm/embeddings/ocr there's no mock variant for the running app (unit tests
    fake the Protocol directly instead, see tests/conftest.py)."""

    def __init__(self) -> None:
        self._session = aioboto3.Session()
        self._bucket = settings.s3_bucket_name

    def _client_ctx(self):
        return self._session.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=Config(signature_version="s3v4"),
        )

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        async with self._client_ctx() as s3:
            await s3.put_object(Bucket=self._bucket, Key=key, Body=data, ContentType=content_type)
        return key

    async def download(self, key: str) -> bytes:
        async with self._client_ctx() as s3:
            response = await s3.get_object(Bucket=self._bucket, Key=key)
            return await response["Body"].read()

    async def delete(self, key: str) -> None:
        async with self._client_ctx() as s3:
            await s3.delete_object(Bucket=self._bucket, Key=key)

    async def get_presigned_url(self, key: str, expires_in: int = 300) -> str:
        async with self._client_ctx() as s3:
            return await s3.generate_presigned_url(
                "get_object", Params={"Bucket": self._bucket, "Key": key}, ExpiresIn=expires_in
            )
