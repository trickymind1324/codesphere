from fastapi import APIRouter, HTTPException

from ..dto.glass_box import GlassBoxNarrativeRequest, GlassBoxNarrativeResponse
from ..providers import get_provider
from ..services import glass_box

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/glass-box-summary", response_model=GlassBoxNarrativeResponse)
async def glass_box_summary(req: GlassBoxNarrativeRequest) -> GlassBoxNarrativeResponse:
    try:
        summary = await glass_box.summarize(provider=get_provider(), req=req)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"llm error: {e}") from e
    return GlassBoxNarrativeResponse(summary=summary.strip())
