from functools import lru_cache

from app.core.config import get_settings
from app.providers.embeddings.base import EmbeddingProvider
from app.providers.embeddings.mock import MockEmbeddingProvider

settings = get_settings()


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    if settings.embedding_provider == "mock":
        return MockEmbeddingProvider()
    if settings.embedding_provider == "openai":
        from app.providers.embeddings.openai_provider import OpenAIEmbeddingProvider

        return OpenAIEmbeddingProvider()  # type: ignore[return-value]
    raise ValueError(f"Unknown EMBEDDING_PROVIDER: {settings.embedding_provider}")
