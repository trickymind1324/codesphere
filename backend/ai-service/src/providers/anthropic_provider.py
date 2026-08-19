import json
from typing import AsyncIterator

import httpx

from .base import LLMProvider, Message

_API_URL = "https://api.anthropic.com/v1/messages"
_API_VERSION = "2023-06-01"


class AnthropicProvider(LLMProvider):
    """Anthropic Messages API over plain httpx (no SDK dependency).

    The Messages API takes the system prompt as a top-level parameter rather
    than a message role, so system messages are split out of the list here.
    """

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic")
        self._model = model
        self._headers = {
            "x-api-key": api_key,
            "anthropic-version": _API_VERSION,
            "content-type": "application/json",
        }

    @staticmethod
    def _split(messages: list[Message]) -> tuple[str, list[dict]]:
        system = "\n\n".join(m.content for m in messages if m.role == "system")
        chat = [
            {"role": m.role, "content": m.content}
            for m in messages
            if m.role != "system"
        ]
        return system, chat

    def _body(
        self, messages: list[Message], max_tokens: int, temperature: float
    ) -> dict:
        system, chat = self._split(messages)
        body: dict = {
            "model": self._model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": chat,
        }
        if system:
            body["system"] = system
        return body

    async def chat(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                _API_URL,
                headers=self._headers,
                json=self._body(messages, max_tokens, temperature),
            )
            resp.raise_for_status()
            data = resp.json()
        return "".join(
            block.get("text", "") for block in data.get("content", [])
            if block.get("type") == "text"
        )

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
                "POST", _API_URL, headers=self._headers, json=body
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    event = json.loads(line[5:].strip())
                    if event.get("type") == "content_block_delta":
                        delta = event.get("delta", {})
                        if delta.get("type") == "text_delta":
                            yield delta.get("text", "")
