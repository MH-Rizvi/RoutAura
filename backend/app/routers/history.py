
from __future__ import annotations

from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]

from app import models, schemas
from app.database import get_db


router = APIRouter(tags=["history"])


@router.get("/history", response_model=schemas.HistoryListResponse)
async def list_history(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
) -> schemas.HistoryListResponse:
    cutoff = datetime.utcnow() - timedelta(days=days)

    histories: List[models.TripHistory] = (
        db.query(models.TripHistory)
        .filter(models.TripHistory.launched_at >= cutoff)
        .order_by(models.TripHistory.launched_at.desc())
        .all()
    )

    return schemas.HistoryListResponse(items=histories)


