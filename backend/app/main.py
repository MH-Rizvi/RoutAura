
from __future__ import annotations

from fastapi import FastAPI  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]

from app.agent import core as agent_core  # noqa: F401  # ensure agent modules are imported
from app.config import settings
from app.database import Base, engine
from app.routers import agent, trips, history, rag, admin
from app.services import vector_service  # noqa: F401  # ensure collections are created


app = FastAPI(
    title="RouteEasy API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),  # pyright: ignore[reportArgumentType]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    Base.metadata.create_all(bind=engine)
    # Importing vector_service at module import time ensures ChromaDB collections are ready.
    _ = vector_service  # noqa: F841


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(agent.router, prefix="/api/v1")
app.include_router(trips.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")
app.include_router(rag.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


