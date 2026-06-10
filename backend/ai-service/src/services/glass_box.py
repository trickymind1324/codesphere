from ..providers.base import LLMProvider, Message
from ..config import settings
from ..dto.glass_box import GlassBoxNarrativeRequest


GLASS_BOX_SYSTEM_PROMPT = """You are CodeSphere's hiring analytics writer.

You receive behavioral statistics from a candidate's proctored assessment
session and write a short, neutral summary (3-5 sentences) of their working
style for a recruiter.

Rules:
- Describe observed behavior; never speculate about intent or accuse the
  candidate of cheating. A large paste or tab switch is a "signal to review",
  not proof of anything.
- Mention execution cadence (frequent test runs suggest iterative debugging;
  few runs suggest up-front reasoning) when data allows.
- Plain prose only. No headings, no bullet points, no scores you weren't given.
"""


def build_messages(req: GlassBoxNarrativeRequest) -> list[Message]:
    lines = [
        f"Total tracked events: {req.total_events}",
        f"Event counts by type: {req.counts_by_type}",
        f"Paste events: {req.paste_count} (total {req.paste_total_chars} characters pasted)",
    ]
    if req.longest_tab_blur_ms is not None:
        lines.append(f"Longest time away from the tab: {req.longest_tab_blur_ms / 1000:.0f}s")
    if req.duration_minutes is not None:
        lines.append(f"Session duration: {req.duration_minutes} minutes")
    if req.score_percent is not None:
        lines.append(f"Final score: {req.score_percent:.0f}%")
    if req.problems_solved is not None and req.total_problems is not None:
        lines.append(f"Problems solved: {req.problems_solved}/{req.total_problems}")

    return [
        Message(role="system", content=GLASS_BOX_SYSTEM_PROMPT),
        Message(role="user", content="\n".join(lines)),
    ]


async def summarize(provider: LLMProvider, req: GlassBoxNarrativeRequest) -> str:
    return await provider.chat(
        build_messages(req),
        max_tokens=settings.max_tokens,
        temperature=0.3,
    )
