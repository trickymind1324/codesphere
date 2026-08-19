from .base import LLMProvider, Message
from .ollama_provider import OllamaProvider
from .anthropic_provider import AnthropicProvider
from .openai_compatible_provider import OpenAICompatibleProvider
from ..config import settings


def get_provider() -> LLMProvider:
    name = settings.llm_provider.lower()
    if name == "ollama":
        return OllamaProvider(
            host=settings.ollama_host,
            model=settings.ollama_model,
        )
    if name in ("anthropic", "claude"):
        return AnthropicProvider(
            api_key=settings.anthropic_api_key,
            model=settings.anthropic_model,
        )
    if name == "openai":
        # Also covers Gemini/Groq/Together/etc. — point OPENAI_BASE_URL at any
        # OpenAI-compatible endpoint and set OPENAI_MODEL accordingly.
        return OpenAICompatibleProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            base_url=settings.openai_base_url,
        )
    raise ValueError(f"unknown LLM_PROVIDER={settings.llm_provider!r}")
