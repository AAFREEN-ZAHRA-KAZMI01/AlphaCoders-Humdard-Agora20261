from datetime import date
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from ..models.profile import OrgType


class CitizenSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    cnic: str
    dob: Optional[date] = None
    cnic_issuance_date: Optional[date] = None
    cnic_valid_upto: Optional[date] = None
    city: Optional[str] = None
    province: Optional[str] = None

    @field_validator("cnic")
    @classmethod
    def cnic_digits_only(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 13:
            raise ValueError("CNIC must be exactly 13 digits")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class NgoSignupRequest(BaseModel):
    email: EmailStr
    password: str
    org_name: str
    registration_number: str
    org_type: OrgType
    year_founded: Optional[int] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    mission_statement: Optional[str] = None
    focus_areas: list[str] = []
    city: Optional[str] = None
    province: Optional[str] = None
    full_address: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class VolunteerSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    cnic: str
    age: Optional[int] = None
    gender: Optional[str] = None
    skills: list[str] = []
    availability: list[str] = []
    max_travel_km: Optional[int] = None
    interest_areas: list[str] = []
    city: Optional[str] = None
    province: Optional[str] = None
    bio: Optional[str] = None

    @field_validator("cnic")
    @classmethod
    def cnic_digits_only(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 13:
            raise ValueError("CNIC must be exactly 13 digits")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    access_token: str


class ResendOTPRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
