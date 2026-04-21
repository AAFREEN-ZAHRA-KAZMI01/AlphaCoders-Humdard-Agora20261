from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...models.user import User, UserType
from ...models.profile import CitizenProfile, NgoProfile, VolunteerProfile
from ...schemas.user import MeResponse, PublicUserResponse, UpdateProfileRequest
from ..deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=MeResponse)
async def update_me(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = body.model_dump(exclude_none=True)

    if current_user.user_type == UserType.citizen:
        allowed = {"full_name", "city", "province", "latitude", "longitude"}
        profile = db.query(CitizenProfile).filter(CitizenProfile.user_id == current_user.id).first()

    elif current_user.user_type == UserType.ngo:
        allowed = {"org_name", "mission_statement", "focus_areas", "phone", "website", "full_address", "city", "province"}
        profile = db.query(NgoProfile).filter(NgoProfile.user_id == current_user.id).first()

    else:  # volunteer
        allowed = {"full_name", "skills", "availability", "interest_areas", "city", "province", "bio", "max_travel_km", "age", "gender"}
        profile = db.query(VolunteerProfile).filter(VolunteerProfile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")

    for field, value in updates.items():
        if field in allowed:
            setattr(profile, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=PublicUserResponse)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user
