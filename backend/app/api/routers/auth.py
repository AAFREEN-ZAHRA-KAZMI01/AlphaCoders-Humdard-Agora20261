import logging
import random
from datetime import datetime, timedelta, timezone

from jose import JWTError
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

log = logging.getLogger(__name__)

from ...core.config import get_settings
from ...core.database import get_db
from ...core.security import (
    create_access_token, create_refresh_token,
    decode_token, hash_password, verify_password,
)
from ...models.otp import OTP
from ...models.profile import CitizenProfile, NgoProfile, VolunteerProfile
from ...models.user import User, UserType
from ...schemas.auth import (
    CitizenSignupRequest, LogoutRequest, MessageResponse,
    NgoSignupRequest, RefreshRequest, ResendOTPRequest,
    SigninRequest, TokenResponse, VerifyOTPRequest, VolunteerSignupRequest,
)
from ...utils.email import send_otp_email
from ..deps import get_redis

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

_OTP_TTL_MINUTES = 10


def _generate_otp() -> str:
    return str(random.randint(0, 999_999)).zfill(6)


def _issue_otp(db: Session, user: User) -> str:
    db.query(OTP).filter(OTP.user_id == user.id, OTP.is_used.is_(False)).update(
        {"is_used": True}, synchronize_session=False
    )
    raw = _generate_otp()
    db.add(OTP(
        user_id=user.id,
        code=hash_password(raw),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES),
        is_used=False,
    ))
    db.commit()
    return raw


async def _finish_signup(db: Session, user: User, email: str) -> MessageResponse:
    try:
        raw_otp = _issue_otp(db, user)
        await send_otp_email(email, raw_otp)
        return {"message": "Account created. Check your email for the OTP."}
    except Exception:
        log.warning("Email send failed — returning OTP in response for demo")
        raw_otp = _issue_otp(db, user)
        return {"message": f"Account created. (Email unavailable) Your OTP is: {raw_otp}"}


@router.post("/signup/citizen", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
async def signup_citizen(body: CitizenSignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    if db.query(CitizenProfile).filter(CitizenProfile.cnic == body.cnic).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "CNIC already registered")

    try:
        user = User(email=body.email, password_hash=hash_password(body.password), user_type=UserType.citizen)
        db.add(user)
        db.flush()
        db.add(CitizenProfile(
            user_id=user.id, full_name=body.full_name, cnic=body.cnic,
            dob=body.dob, cnic_issuance_date=body.cnic_issuance_date,
            cnic_valid_upto=body.cnic_valid_upto, city=body.city, province=body.province,
        ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email or CNIC already registered")
    return await _finish_signup(db, user, body.email)


@router.post("/signup/ngo", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
async def signup_ngo(body: NgoSignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    if db.query(NgoProfile).filter(NgoProfile.registration_number == body.registration_number).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Registration number already in use")

    try:
        user = User(email=body.email, password_hash=hash_password(body.password), user_type=UserType.ngo)
        db.add(user)
        db.flush()
        db.add(NgoProfile(
            user_id=user.id, org_name=body.org_name, registration_number=body.registration_number,
            org_type=body.org_type, year_founded=body.year_founded, phone=body.phone,
            website=body.website, mission_statement=body.mission_statement,
            focus_areas=body.focus_areas, city=body.city, province=body.province,
            full_address=body.full_address,
        ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email or registration number already registered")
    return await _finish_signup(db, user, body.email)


@router.post("/signup/volunteer", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
async def signup_volunteer(body: VolunteerSignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    try:
        user = User(email=body.email, password_hash=hash_password(body.password), user_type=UserType.volunteer)
        db.add(user)
        db.flush()
        db.add(VolunteerProfile(
            user_id=user.id, full_name=body.full_name, cnic=body.cnic,
            age=body.age, gender=body.gender, skills=body.skills,
            availability=body.availability, max_travel_km=body.max_travel_km,
            interest_areas=body.interest_areas, city=body.city, province=body.province, bio=body.bio,
        ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email or CNIC already registered")
    return await _finish_signup(db, user, body.email)


@router.post("/signin", response_model=MessageResponse)
async def signin(body: SigninRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")

    raw_otp = _issue_otp(db, user)
    try:
        await send_otp_email(body.email, raw_otp)
        return {"message": "OTP sent to your email"}
    except Exception:
        log.warning("Email send failed — returning OTP in response for demo")
        return {"message": f"(Email unavailable) Your OTP is: {raw_otp}"}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    otp = (
        db.query(OTP)
        .filter(OTP.user_id == user.id, OTP.is_used.is_(False))
        .order_by(OTP.expires_at.desc())
        .first()
    )
    now = datetime.now(timezone.utc)
    if not otp or otp.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP expired or not found")
    if not verify_password(body.code, otp.code):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid OTP")

    otp.is_used = True
    if not user.is_verified:
        user.is_verified = True
    db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, redis: aioredis.Redis = Depends(get_redis)):
    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not a refresh token")
    if await redis.get(f"blacklist:{body.refresh_token}"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token revoked")

    return TokenResponse(
        access_token=create_access_token(payload["sub"]),
        refresh_token=body.refresh_token,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(body: LogoutRequest, redis: aioredis.Redis = Depends(get_redis)):
    try:
        payload = decode_token(body.access_token)
        exp = payload.get("exp", 0)
        ttl = max(0, exp - int(datetime.now(timezone.utc).timestamp()))
        if ttl:
            await redis.setex(f"blacklist:{body.access_token}", ttl, "1")
    except JWTError:
        pass  # already invalid — nothing to blacklist
    return {"message": "Logged out successfully"}


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(
    body: ResendOTPRequest,
    db: Session = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Don't reveal whether the email exists
        return {"message": "If that email is registered, an OTP has been sent"}

    rate_key = f"otp_resend:{user.id}"
    if await redis.get(rate_key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Wait 1 minute before requesting a new OTP")

    raw_otp = _issue_otp(db, user)
    await redis.setex(rate_key, 60, "1")
    try:
        await send_otp_email(body.email, raw_otp)
        return {"message": "OTP sent to your email"}
    except Exception:
        return {"message": f"(Email unavailable) Your OTP is: {raw_otp}"}
