from typing import Protocol


class EmbeddingProvider(Protocol):
    dimension: int

    async def embed_text(self, text: str) -> list[float]: ...

    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...
