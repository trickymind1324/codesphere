from abc import ABC, abstractmethod
from typing import AsyncIterator, Literal
from pydantic import BaseModel


Role = Literal["system", "user", "assistant"]


class Message(BaseModel):
    role: Role
    content: str


class LLMProvider(ABC):
    """Provider-agnostic LLM transport.

    Implementations translate the generic message list into whatever shape the
    underlying SDK wants. Consumers (services/socratic.py) speak only this
    interface, so swapping providers is a config change.
    """

    @abstractmethod
    async def chat(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> str:
        ...

    @abstractmethod
    async def stream(
        self,
        messages: list[Message],
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> AsyncIterator[str]:
        ...
