from pydantic import BaseModel, Field
from ..providers.base import Message


class SocraticRequest(BaseModel):
    problem_title: str = Field(..., min_length=1, max_length=300)
    problem_description: str = Field(..., min_length=1, max_length=10_000)
    user_code: str = Field("", max_length=20_000)
    user_language: str = Field("python", max_length=20)
    user_message: str = Field(..., min_length=1, max_length=2_000)
    history: list[Message] = Field(default_factory=list)


class SocraticResponse(BaseModel):
    question: str
