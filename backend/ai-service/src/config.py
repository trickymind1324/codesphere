from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8004
    api_prefix: str = "/api/v1"
    cors_origin: str = "http://localhost:3000"

    llm_provider: str = "ollama"

    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    max_tokens: int = 512
    temperature: float = 0.7


settings = Settings()
