from fastapi import APIRouter, HTTPException

from ..dto.socratic import SocraticRequest, SocraticResponse
from ..providers import get_provider
from ..services import socratic

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/socratic", response_model=SocraticResponse)
async def socratic_ask(req: SocraticRequest) -> SocraticResponse:
    try:
        answer = await socratic.ask(
            provider=get_provider(),
            problem_title=req.problem_title,
            problem_description=req.problem_description,
            user_code=req.user_code,
            user_language=req.user_language,
            user_message=req.user_message,
            history=req.history,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"llm error: {e}") from e
    return SocraticResponse(question=answer.strip())
