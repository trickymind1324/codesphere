from typing import AsyncIterator
from ollama import AsyncClient

from .base import LLMProvider, Message


class OllamaProvider(LLMProvider):
    def __init__(self, host: str, model: str):
        self._client = AsyncClient(host=host)
        self._model = model

    async def chat(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> str:
        resp = await self._client.chat(
            model=self._model,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            options={"num_predict": max_tokens, "temperature": temperature},
        )
        return resp["message"]["content"]

    async def stream(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        async for chunk in await self._client.chat(
            model=self._model,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            options={"num_predict": max_tokens, "temperature": temperature},
            stream=True,
        ):
            yield chunk["message"]["content"]
