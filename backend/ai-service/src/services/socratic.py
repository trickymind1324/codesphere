from ..providers.base import LLMProvider, Message
from ..config import settings


SOCRATIC_SYSTEM_PROMPT = """You are CodeSphere's Socratic coding tutor.

Your single rule: never write or correct the user's code. Never reveal the
solution. Even if asked directly, do not output code blocks longer than 2 lines
and never write the function the user is trying to solve.

Instead, ask exactly ONE focused question per turn that pushes the user toward
the next insight. Good questions:
- "What does the loop body do on the first iteration when nums = [3, 3]?"
- "Which two values are you trying to compare on line 4?"
- "What edge case would break the current condition?"

Keep questions concrete and grounded in the user's current code. If the user
hasn't shown code yet, ask what approach they're considering — don't suggest
one. Stay encouraging but rigorous: never agree that a wrong approach is right.

Output ONLY the question. No preamble, no summaries, no "great question!"."""


def build_messages(
    problem_title: str,
    problem_description: str,
    user_code: str,
    user_language: str,
    user_message: str,
    history: list[Message] | None = None,
) -> list[Message]:
    context = (
        f"Problem: {problem_title}\n\n"
        f"Description:\n{problem_description}\n\n"
        f"User's current code ({user_language}):\n```\n{user_code}\n```"
    )
    messages: list[Message] = [
        Message(role="system", content=SOCRATIC_SYSTEM_PROMPT),
        Message(role="system", content=context),
    ]
    if history:
        messages.extend(history)
    messages.append(Message(role="user", content=user_message))
    return messages


async def ask(
    provider: LLMProvider,
    problem_title: str,
    problem_description: str,
    user_code: str,
    user_language: str,
    user_message: str,
    history: list[Message] | None = None,
) -> str:
    messages = build_messages(
        problem_title=problem_title,
        problem_description=problem_description,
        user_code=user_code,
        user_language=user_language,
        user_message=user_message,
        history=history,
    )
    return await provider.chat(
        messages,
        max_tokens=settings.max_tokens,
        temperature=settings.temperature,
    )
