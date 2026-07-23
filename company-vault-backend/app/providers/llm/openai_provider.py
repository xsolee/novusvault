"""LLM_PROVIDER=openai — deferred. Wire in once real LLM credentials exist;
must implement the same interface as app/providers/llm/base.py:LLMProvider."""


class OpenAILLMProvider:
    def __init__(self) -> None:
        raise NotImplementedError("Set LLM_PROVIDER=mock, or implement OpenAILLMProvider before using it.")
