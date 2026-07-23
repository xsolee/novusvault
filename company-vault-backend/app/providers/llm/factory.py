from functools import lru_cache

from app.core.config import get_settings
from app.providers.llm.base import LLMProvider
from app.providers.llm.mock import MockLLMProvider

settings = get_settings()


@lru_cache
def get_llm_provider() -> LLMProvider:
    if settings.llm_provider == "mock":
        return MockLLMProvider()
    if settings.llm_provider == "openai":
        from app.providers.llm.openai_provider import OpenAILLMProvider

        return OpenAILLMProvider()  # type: ignore[return-value]
    if settings.llm_provider == "anthropic":
        from app.providers.llm.anthropic_provider import AnthropicLLMProvider

        return AnthropicLLMProvider()  # type: ignore[return-value]
    raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider}")
