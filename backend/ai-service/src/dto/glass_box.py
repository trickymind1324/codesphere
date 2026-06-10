from pydantic import BaseModel, Field


class GlassBoxNarrativeRequest(BaseModel):
    total_events: int = Field(..., ge=0)
    counts_by_type: dict[str, int] = Field(default_factory=dict)
    paste_count: int = Field(0, ge=0)
    paste_total_chars: int = Field(0, ge=0)
    longest_tab_blur_ms: int | None = None
    duration_minutes: int | None = Field(None, ge=0)
    score_percent: float | None = Field(None, ge=0, le=100)
    problems_solved: int | None = Field(None, ge=0)
    total_problems: int | None = Field(None, ge=0)


class GlassBoxNarrativeResponse(BaseModel):
    summary: str
