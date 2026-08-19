from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8004
    api_prefix: str = "/api/v1"
    cors_origin: str = "http://localhost:3000"

    # "ollama" (local, default) | "anthropic" | "openai" (any OpenAI-compatible
    # endpoint — OpenAI, Gemini, Groq, ... — via openai_base_url)
    llm_provider: str = "ollama"

    ollama_host: str = "http://localhost:11434"
    # Keep in sync with .env.example and docker-compose.prod.yml
    ollama_model: str = "gemma3:4b"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = "https://api.openai.com/v1"

    max_tokens: int = 512
    temperature: float = 0.7


settings = Settings()
