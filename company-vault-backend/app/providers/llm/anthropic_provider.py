"""LLM_PROVIDER=anthropic — deferred. Wire in once real LLM credentials exist;
must implement the same interface as app/providers/llm/base.py:LLMProvider."""


class AnthropicLLMProvider:
    def __init__(self) -> None:
        raise NotImplementedError(
            "Set LLM_PROVIDER=mock, or implement AnthropicLLMProvider before using it."
        )
