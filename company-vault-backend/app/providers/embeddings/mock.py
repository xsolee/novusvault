import hashlib
import math
import random


class MockEmbeddingProvider:
    """Deterministic (same text -> same vector always) but NOT semantically
    meaningful — cosine similarity between unrelated mock vectors is
    essentially random. In mock mode, retrieval relevance leans on the
    Postgres full-text half of the hybrid query; EMBEDDING_PROVIDER=openai
    restores genuine semantic similarity via the same interface."""

    dimension = 768

    async def embed_text(self, text: str) -> list[float]:
        seed = int(hashlib.sha256(text.encode()).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)
        vector = [rng.uniform(-1.0, 1.0) for _ in range(self.dimension)]
        norm = math.sqrt(sum(v * v for v in vector)) or 1.0
        return [v / norm for v in vector]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [await self.embed_text(text) for text in texts]
