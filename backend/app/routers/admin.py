
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]

from app import models, schemas
from app.database import get_db


router = APIRouter(tags=["admin"])


@router.get("/admin/llm-logs", response_model=schemas.LLMLogListResponse)
async def get_llm_logs(
    db: Session = Depends(get_db),
) -> schemas.LLMLogListResponse:
    logs: List[models.LLMLog] = (
        db.query(models.LLMLog)
        .order_by(models.LLMLog.timestamp.desc())
        .all()
    )
    return schemas.LLMLogListResponse(items=logs, total=len(logs))  # pyright: ignore[reportArgumentType]


