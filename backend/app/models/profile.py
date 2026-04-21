import uuid
import enum
from sqlalchemy import Column, String, Boolean, Integer, Float, Text, Date, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..core.database import Base


class OrgType(str, enum.Enum):
    ngo = "ngo"
    charity = "charity"
    foundation = "foundation"
    trust = "trust"
    community = "community"


class CitizenProfile(Base):
    __tablename__ = "citizen_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String, nullable=False)
    cnic = Column(String(13), unique=True, nullable=False)
    dob = Column(Date, nullable=True)
    cnic_issuance_date = Column(Date, nullable=True)
    cnic_valid_upto = Column(Date, nullable=True)
    city = Column(String, nullable=True)
    province = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    user = relationship("User", back_populates="citizen_profile")


class NgoProfile(Base):
    __tablename__ = "ngo_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    org_name = Column(String, nullable=False)
    registration_number = Column(String, unique=True, nullable=False)
    org_type = Column(Enum(OrgType, name="orgtype"), nullable=False)
    year_founded = Column(Integer, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    mission_statement = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    focus_areas = Column(JSONB, nullable=False, default=list)
    city = Column(String, nullable=True)
    province = Column(String, nullable=True)
    full_address = Column(String, nullable=True)

    user = relationship("User", back_populates="ngo_profile")


class VolunteerProfile(Base):
    __tablename__ = "volunteer_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String, nullable=False)
    cnic = Column(String(13), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    skills = Column(JSONB, nullable=False, default=list)
    availability = Column(JSONB, nullable=False, default=list)
    max_travel_km = Column(Integer, nullable=True)
    interest_areas = Column(JSONB, nullable=False, default=list)
    city = Column(String, nullable=True)
    province = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    user = relationship("User", back_populates="volunteer_profile")
