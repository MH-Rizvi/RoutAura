from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(tags=["stats"])

@router.get("/stats/summary", response_model=schemas.StatsSummaryResponse)
async def get_stats_summary(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> schemas.StatsSummaryResponse:
    now = datetime.utcnow()
    # today is entries where launched_at >= today 00:00
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    # this_week is entries where launched_at >= 7 days ago
    week_start = now - timedelta(days=7)

    histories = (
        db.query(models.TripHistory)
        .filter(models.TripHistory.user_id == current_user.id)
        .all()
    )

    trips_today = 0
    trips_this_week = 0
    total_trips = len(histories)

    stops_today = 0
    stops_this_week = 0
    total_stops = 0

    miles_today = 0.0
    miles_this_week = 0.0
    miles_all_time = 0.0

    for h in histories:
        # Avoid json parse if unnecessary, but we need stops length
        try:
            stops_count = len(json.loads(h.stops_json))
        except Exception:
            stops_count = 0

        total_stops += stops_count
        miles = h.total_miles or 0.0
        miles_all_time += miles

        if h.launched_at >= today_start:
            trips_today += 1
            stops_today += stops_count
            miles_today += miles

        if h.launched_at >= week_start:
            trips_this_week += 1
            stops_this_week += stops_count
            miles_this_week += miles

    return schemas.StatsSummaryResponse(
        trips_today=trips_today,
        trips_this_week=trips_this_week,
        stops_today=stops_today,
        stops_this_week=stops_this_week,
        miles_today=round(miles_today, 2),
        miles_this_week=round(miles_this_week, 2),
        miles_all_time=round(miles_all_time, 2),
        total_trips=total_trips,
        total_stops=total_stops
    )

@router.get("/stats/daily", response_model=List[schemas.DailyStatResponse])
async def get_daily_stats(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> List[schemas.DailyStatResponse]:
    now = datetime.utcnow()
    start_date = (now - timedelta(days=days - 1)).date()

    # Pre-populate empty daily stats
    daily_stats = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        daily_stats[d.isoformat()] = {
            "date": d.isoformat(),
            "trips": 0,
            "stops": 0,
            "miles": 0.0
        }

    # Fetch entries from DB
    cutoff = datetime.combine(start_date, datetime.min.time())
    histories = (
        db.query(models.TripHistory)
        .filter(models.TripHistory.user_id == current_user.id)
        .filter(models.TripHistory.launched_at >= cutoff)
        .all()
    )

    for h in histories:
        try:
            stops_count = len(json.loads(h.stops_json))
        except Exception:
            stops_count = 0
            
        miles = h.total_miles or 0.0
        date_str = h.launched_at.date().isoformat()
        
        if date_str in daily_stats:
            daily_stats[date_str]["trips"] += 1
            daily_stats[date_str]["stops"] += stops_count
            daily_stats[date_str]["miles"] += miles

    # round miles
    for stat in daily_stats.values():
        stat["miles"] = round(stat["miles"], 2)

    # Return ordered (already ordered by dict insertion since Python 3.7+)
    return [schemas.DailyStatResponse(**stat) for stat in daily_stats.values()]
