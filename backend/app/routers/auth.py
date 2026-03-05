from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Dict, Any
from pydantic import BaseModel

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.supabase_client import supabase

router = APIRouter()


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(request: schemas.SignupRequest, response: Response, db: Session = Depends(get_db)):
    """Register a new user via Supabase Auth and create their location profile."""
    try:
        auth_res = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_res.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed or email already registered"
            )
            
        user_uuid = auth_res.user.id
        full_loc = f"{request.city}, {request.state}"
        
        new_profile = models.UserProfile(
            user_id=user_uuid,
            city=request.city,
            state=request.state,
            zip_code=request.zip_code,
            full_location=full_loc
        )
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        
        access_token = auth_res.session.access_token if auth_res.session else None
        
        return {
            "access_token": access_token,
            "user": {
                "id": user_uuid,
                "email": request.email,
                "city": request.city,
                "state": request.state,
                "zip_code": request.zip_code,
                "full_location": full_loc
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=dict)
async def login(request: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Login via Supabase Auth and fetch profile."""
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_res.user or not auth_res.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
            
        user_uuid = auth_res.user.id
        
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_uuid).first()
        
        return {
            "access_token": auth_res.session.access_token,
            "refresh_token": auth_res.session.refresh_token,
            "user": {
                "id": user_uuid,
                "email": request.email,
                "city": profile.city if profile else "",
                "state": profile.state if profile else "",
                "zip_code": profile.zip_code if profile else "",
                "full_location": profile.full_location if profile else ""
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/google", response_model=dict)
async def google_login():
    """Get Google OAuth URL via Supabase."""
    try:
        auth_res = supabase.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {"redirect_to": "http://localhost:5173"}
        })
        return {"url": auth_res.url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/refresh", response_model=dict)
async def refresh(request: Request):
    """Get a new access token using a refresh token."""
    try:
        body = await request.json()
        refresh_token = body.get("refresh_token")
    except Exception:
        refresh_token = request.cookies.get("refresh_token")
        
    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token")
        
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )
        
    try:
        auth_res = supabase.auth.refresh_session(refresh_token)
        if not auth_res.session:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        return {"access_token": auth_res.session.access_token}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=dict)
async def me(current_user: Any = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the current user's profile based on the validated Supabase access token."""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    
    # Implicitly handle new Google/OAuth signups by creating a blank profile if it doesn't exist
    if not profile:
        profile = models.UserProfile(
            user_id=str(current_user.id),
            first_name=current_user.user_metadata.get("full_name", "").split(" ")[0] if current_user.user_metadata else "",
            last_name=" ".join(current_user.user_metadata.get("full_name", "").split(" ")[1:]) if current_user.user_metadata else "",
            city="Set your city",
            state="??",
            zip_code="00000",
            full_location="Update your location"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    is_new = profile.city == "Set your city"
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "birthday": profile.birthday,
        "city": profile.city,
        "state": profile.state,
        "zip_code": profile.zip_code,
        "full_location": profile.full_location,
        "is_new_user": is_new
    }


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    birthday: str | None = None


@router.patch("/me", response_model=dict)
async def update_profile(request: ProfileUpdate, current_user: Any = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update the current user's profile information."""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == str(current_user.id)).first()
    if not profile:
        profile = models.UserProfile(user_id=str(current_user.id))
        db.add(profile)

    if request.first_name is not None: profile.first_name = request.first_name
    if request.last_name is not None: profile.last_name = request.last_name
    if request.city is not None: profile.city = request.city
    if request.state is not None: profile.state = request.state
    if request.zip_code is not None: profile.zip_code = request.zip_code
    if request.birthday is not None: profile.birthday = request.birthday
    
    if profile.city and profile.state:
        profile.full_location = f"{profile.city}, {profile.state}"
    
    db.commit()
    db.refresh(profile)
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "birthday": profile.birthday,
        "city": profile.city,
        "state": profile.state,
        "zip_code": profile.zip_code,
        "full_location": profile.full_location,
        "is_new_user": False
    }
