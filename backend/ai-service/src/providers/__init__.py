from .base import LLMProvider, Message
from .ollama_provider import OllamaProvider
from ..config import settings


def get_provider() -> LLMProvider:
    name = settings.llm_provider.lower()
    if name == "ollama":
        return OllamaProvider(
            host=settings.ollama_host,
            model=settings.ollama_model,
        )
    # Future: add ClaudeProvider, OpenAIProvider here without touching call sites.
    raise ValueError(f"unknown LLM_PROVIDER={settings.llm_provider!r}")
