"""EMBEDDING_PROVIDER=openai — deferred. Must implement the same interface
as app/providers/embeddings/base.py:EmbeddingProvider."""


class OpenAIEmbeddingProvider:
    def __init__(self) -> None:
        raise NotImplementedError(
            "Set EMBEDDING_PROVIDER=mock, or implement OpenAIEmbeddingProvider before using it."
        )
