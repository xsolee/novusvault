import httpx

from app.core.config import get_settings

settings = get_settings()


class OllamaEmbeddingProvider:
    """Real embedding provider backed by a self-hosted Ollama instance running
    `nomic-embed-text` (768-dim — the `document_embeddings.embedding` column is pinned to this
    width; switching to a different-dimension provider later requires a migration + re-embed)."""

    dimension = 768

    def __init__(self) -> None:
        self._model = settings.ollama_embedding_model
        self._client = httpx.AsyncClient(
            base_url=settings.ollama_base_url,
            timeout=httpx.Timeout(settings.ollama_request_timeout_seconds),
        )

    async def embed_text(self, text: str) -> list[float]:
        vectors = await self._embed([text])
        return vectors[0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return await self._embed(texts)

    async def _embed(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.post(
            "/api/embed", json={"model": self._model, "input": texts}
        )
        response.raise_for_status()
        return response.json()["embeddings"]
