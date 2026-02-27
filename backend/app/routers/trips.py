
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]

from app import models, schemas
from app.database import get_db
from app.services import trips_service


router = APIRouter(tags=["trips"])


@router.get("/trips", response_model=List[schemas.Trip])
async def list_trips(db: Session = Depends(get_db)) -> List[schemas.Trip]:
    trips = await trips_service.list_trips(db)
    return trips  # pyright: ignore[reportReturnType]


@router.get("/trips/{trip_id}", response_model=schemas.Trip)
async def get_trip(trip_id: int, db: Session = Depends(get_db)) -> schemas.Trip:
    trip = await trips_service.get_trip(db, trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found.",
        )
    return trip


@router.post("/trips", response_model=schemas.Trip, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: schemas.TripCreate,
    db: Session = Depends(get_db),
) -> schemas.Trip:
    trip = await trips_service.create_trip(db, trip_data)
    return trip


@router.delete("/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(trip_id: int, db: Session = Depends(get_db)) -> None:
    success = await trips_service.delete_trip(db, trip_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found.",
        )
    return None


@router.post("/trips/{trip_id}/launch", response_model=schemas.TripHistory)
async def launch_trip(trip_id: int, db: Session = Depends(get_db)) -> schemas.TripHistory:
    history = await trips_service.launch_trip(db, trip_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found.",
        )
    return history


