import json
from typing import AsyncIterator

import httpx

from .base import LLMProvider, Message


class OpenAICompatibleProvider(LLMProvider):
    """Any endpoint speaking the OpenAI chat-completions dialect.

    Covers OpenAI itself plus every vendor exposing an OpenAI-compatible
    endpoint via a different base URL — Google Gemini
    (https://generativelanguage.googleapis.com/v1beta/openai), Groq, Together,
    Mistral, a local Ollama (http://localhost:11434/v1), and so on.
    """

    def __init__(self, api_key: str, model: str, base_url: str):
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
        self._model = model
        self._url = f"{base_url.rstrip('/')}/chat/completions"
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "content-type": "application/json",
        }

    def _body(
        self, messages: list[Message], max_tokens: int, temperature: float
    ) -> dict:
        return {
            "model": self._model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
        }

    async def chat(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                self._url,
                headers=self._headers,
                json=self._body(messages, max_tokens, temperature),
            )
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"] or ""

    async def stream(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        body = self._body(messages, max_tokens, temperature)
        body["stream"] = True
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", self._url, headers=self._headers, json=body
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        break
                    chunk = json.loads(payload)
                    choices = chunk.get("choices") or []
                    if choices:
                        text = choices[0].get("delta", {}).get("content")
                        if text:
                            yield text
