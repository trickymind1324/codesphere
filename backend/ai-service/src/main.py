from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import glass_box_router, socratic_router

app = FastAPI(title="CodeSphere AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(socratic_router, prefix=settings.api_prefix)
app.include_router(glass_box_router, prefix=settings.api_prefix)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "provider": settings.llm_provider}
