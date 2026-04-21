from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from ..models.case_funding import CaseCategory, CaseStatus, LedgerType, MilestoneStatus


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateCaseRequest(BaseModel):
    post_id: UUID
    title: str
    category: CaseCategory


class FundCaseRequest(BaseModel):
    amount: Decimal = Field(..., ge=Decimal("100"), le=Decimal("100000"))
    is_anonymous: bool = False
    note: Optional[str] = None


class AddMilestoneRequest(BaseModel):
    title: str
    description: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: CaseStatus


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class MilestoneResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    status: MilestoneStatus
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LedgerEntryResponse(BaseModel):
    id: UUID
    transaction_type: LedgerType
    from_user_display: str
    amount: Decimal
    note: Optional[str] = None
    hash: str
    previous_hash: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class CaseSummaryResponse(BaseModel):
    id: UUID
    post_id: UUID
    title: str
    category: CaseCategory
    status: CaseStatus
    total_funds: Decimal
    contributor_count: int = 0
    post_thumbnail: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CaseDetailResponse(BaseModel):
    id: UUID
    post_id: UUID
    title: str
    category: CaseCategory
    status: CaseStatus
    total_funds: Decimal
    contributor_count: int = 0
    anonymous_count: int = 0
    post_thumbnail: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    milestones: list[MilestoneResponse] = []
    recent_ledger: list[LedgerEntryResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class TransparencyResponse(BaseModel):
    case_id: UUID
    title: str
    status: CaseStatus
    total_funds: Decimal
    contributor_count: int = 0
    anonymous_count: int = 0
    chain_integrity: bool
    milestones: list[MilestoneResponse] = []
    ledger: list[LedgerEntryResponse] = []

    model_config = {"from_attributes": True}


class PaginatedCases(BaseModel):
    items: list[CaseSummaryResponse]
    total: int
    page: int
    size: int
    pages: int
