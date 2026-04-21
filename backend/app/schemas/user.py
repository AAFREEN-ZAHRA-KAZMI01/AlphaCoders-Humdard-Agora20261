from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr
from ..models.user import UserType
from ..models.profile import OrgType


class CitizenProfileResponse(BaseModel):
    id: UUID
    full_name: str
    cnic: str
    dob: Optional[date] = None
    city: Optional[str] = None
    province: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    model_config = {"from_attributes": True}


class NgoProfileResponse(BaseModel):
    id: UUID
    org_name: str
    org_type: OrgType
    registration_number: str
    year_founded: Optional[int] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    mission_statement: Optional[str] = None
    logo_url: Optional[str] = None
    focus_areas: list = []
    city: Optional[str] = None
    province: Optional[str] = None
    full_address: Optional[str] = None
    model_config = {"from_attributes": True}


class VolunteerProfileResponse(BaseModel):
    id: UUID
    full_name: str
    cnic: str
    age: Optional[int] = None
    gender: Optional[str] = None
    skills: list = []
    availability: list = []
    max_travel_km: Optional[int] = None
    interest_areas: list = []
    city: Optional[str] = None
    province: Optional[str] = None
    bio: Optional[str] = None
    model_config = {"from_attributes": True}


class MeResponse(BaseModel):
    id: UUID
    email: EmailStr
    user_type: UserType
    is_verified: bool
    is_active: bool
    created_at: datetime
    citizen_profile: Optional[CitizenProfileResponse] = None
    ngo_profile: Optional[NgoProfileResponse] = None
    volunteer_profile: Optional[VolunteerProfileResponse] = None
    model_config = {"from_attributes": True}


class PublicUserResponse(BaseModel):
    id: UUID
    user_type: UserType
    citizen_profile: Optional[CitizenProfileResponse] = None
    ngo_profile: Optional[NgoProfileResponse] = None
    volunteer_profile: Optional[VolunteerProfileResponse] = None
    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    """Unified update schema — only fields relevant to the user's type are applied."""
    # Shared / citizen / volunteer
    full_name: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # NGO
    org_name: Optional[str] = None
    mission_statement: Optional[str] = None
    focus_areas: Optional[list[str]] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    full_address: Optional[str] = None
    # Volunteer
    skills: Optional[list[str]] = None
    availability: Optional[list[str]] = None
    interest_areas: Optional[list[str]] = None
    bio: Optional[str] = None
    max_travel_km: Optional[int] = None
    age: Optional[int] = None
    gender: Optional[str] = None
