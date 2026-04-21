import math
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ...core.database import get_db
from ...models.case_funding import (
    Case,
    CaseStatus,
    Ledger,
    LedgerType,
    Milestone,
    MilestoneStatus,
)
from ...models.post import Post, PostMedia
from ...models.user import User
from ...schemas.case import (
    AddMilestoneRequest,
    CaseDetailResponse,
    CaseSummaryResponse,
    CreateCaseRequest,
    FundCaseRequest,
    LedgerEntryResponse,
    MilestoneResponse,
    PaginatedCases,
    TransparencyResponse,
    UpdateStatusRequest,
    CaseCategory,
)
from ...services import ledger_service
from ..deps import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _case_contributor_count(db: Session, case_id: UUID) -> int:
    """Count distinct funding ledger entries for a case."""
    return (
        db.query(func.count(Ledger.id))
        .filter(
            Ledger.case_id == case_id,
            Ledger.transaction_type == LedgerType.funding,
        )
        .scalar()
        or 0
    )


def _anonymous_count(db: Session, case_id: UUID) -> int:
    """Count funding entries that were flagged anonymous."""
    return (
        db.query(func.count(Ledger.id))
        .filter(
            Ledger.case_id == case_id,
            Ledger.transaction_type == LedgerType.funding,
            Ledger.is_anonymous == True,  # noqa: E712
        )
        .scalar()
        or 0
    )


def _to_ledger_response(entry: Ledger) -> dict:
    """
    Convert a Ledger ORM row to a LedgerEntryResponse-compatible dict.

    Display name rules:
    - is_anonymous or no from_user_id  → "Anonymous"
    - citizen_profile.full_name        → use that
    - ngo_profile.org_name             → use that
    - volunteer_profile.full_name      → use that
    - fallback                         → part before @ in email
    """
    if entry.is_anonymous or entry.from_user_id is None:
        display = "Anonymous"
    else:
        user: Optional[User] = entry.from_user
        if user is None:
            display = "Anonymous"
        elif user.citizen_profile and user.citizen_profile.full_name:
            display = user.citizen_profile.full_name
        elif user.ngo_profile and user.ngo_profile.org_name:
            display = user.ngo_profile.org_name
        elif user.volunteer_profile and user.volunteer_profile.full_name:
            display = user.volunteer_profile.full_name
        else:
            display = user.email.split("@")[0]

    return {
        "id": entry.id,
        "transaction_type": entry.transaction_type,
        "from_user_display": display,
        "amount": entry.amount,
        "note": entry.note,
        "hash": entry.hash,
        "previous_hash": entry.previous_hash,
        "timestamp": entry.timestamp,
    }


def _post_thumbnail(post: Post) -> Optional[str]:
    """Return the URL of the first image media attached to a post, or None."""
    if not post or not post.media:
        return None
    for m in post.media:
        return m.media_url
    return None


def _build_case_summary(case: Case, db: Session) -> dict:
    contributor_count = _case_contributor_count(db, case.id)
    post = case.post
    thumbnail = _post_thumbnail(post) if post else None
    location_name = post.location_name if post else None
    latitude = post.latitude if post else None
    longitude = post.longitude if post else None

    return {
        "id": case.id,
        "post_id": case.post_id,
        "title": case.title,
        "category": case.category,
        "status": case.status,
        "total_funds": case.total_funds,
        "contributor_count": contributor_count,
        "post_thumbnail": thumbnail,
        "location_name": location_name,
        "latitude": latitude,
        "longitude": longitude,
        "created_at": case.created_at,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=CaseSummaryResponse)
async def create_case(
    body: CreateCaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a humanitarian case from an existing post."""
    # Verify post exists
    post = db.query(Post).filter(Post.id == body.post_id).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")

    # Check no case already attached to this post
    existing = db.query(Case).filter(Case.post_id == body.post_id).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "A case already exists for this post")

    case = Case(
        post_id=body.post_id,
        title=body.title,
        category=body.category,
        status=CaseStatus.reported,
    )
    db.add(case)
    db.flush()  # get case.id

    # Genesis verification ledger entry
    ledger_service.create_ledger_entry(
        db=db,
        case_id=case.id,
        transaction_type=LedgerType.verification,
        from_user_id=current_user.id,
        amount=0,
        note="Case created",
        is_anonymous=False,
    )

    db.refresh(case)
    return _build_case_summary(case, db)


@router.get("/", response_model=PaginatedCases)
async def list_cases(
    category: Optional[CaseCategory] = None,
    status: Optional[CaseStatus] = None,
    post_id: Optional[UUID] = None,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List cases with optional filters and pagination."""
    size = min(size, 100)
    query = db.query(Case).options(
        joinedload(Case.post).joinedload(Post.media)
    )

    if category is not None:
        query = query.filter(Case.category == category)
    if status is not None:
        query = query.filter(Case.status == status)
    if post_id is not None:
        query = query.filter(Case.post_id == post_id)

    total = query.count()
    cases = (
        query.order_by(Case.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    items = [CaseSummaryResponse(**_build_case_summary(c, db)) for c in cases]

    return PaginatedCases(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 0,
    )


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full case detail including milestones and recent ledger."""
    case = (
        db.query(Case)
        .options(
            joinedload(Case.post).joinedload(Post.media),
            joinedload(Case.milestones),
            joinedload(Case.ledger_entries).joinedload(Ledger.from_user),
        )
        .filter(Case.id == case_id)
        .first()
    )
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    contributor_count = _case_contributor_count(db, case.id)
    anon_count = _anonymous_count(db, case.id)

    # Most recent 10 ledger entries for summary view
    recent_entries = sorted(case.ledger_entries, key=lambda e: e.timestamp, reverse=True)[:10]
    recent_ledger = [LedgerEntryResponse(**_to_ledger_response(e)) for e in recent_entries]

    milestones = [MilestoneResponse.model_validate(m) for m in case.milestones]

    post = case.post
    return CaseDetailResponse(
        id=case.id,
        post_id=case.post_id,
        title=case.title,
        category=case.category,
        status=case.status,
        total_funds=case.total_funds,
        contributor_count=contributor_count,
        anonymous_count=anon_count,
        post_thumbnail=_post_thumbnail(post) if post else None,
        location_name=post.location_name if post else None,
        latitude=post.latitude if post else None,
        longitude=post.longitude if post else None,
        milestones=milestones,
        recent_ledger=recent_ledger,
        created_at=case.created_at,
    )


@router.post("/{case_id}/fund", status_code=status.HTTP_201_CREATED, response_model=LedgerEntryResponse)
async def fund_case(
    case_id: UUID,
    body: FundCaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Contribute funds to a case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    if case.status == CaseStatus.resolved or case.status == CaseStatus.closed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Case is no longer accepting funds")

    entry = ledger_service.create_ledger_entry(
        db=db,
        case_id=case.id,
        transaction_type=LedgerType.funding,
        from_user_id=current_user.id,
        amount=body.amount,
        note=body.note,
        is_anonymous=body.is_anonymous,
    )

    # Reload relationships needed for display
    db.refresh(entry)
    if not entry.is_anonymous and entry.from_user_id:
        _ = entry.from_user  # eagerly load

    return LedgerEntryResponse(**_to_ledger_response(entry))


@router.get("/{case_id}/ledger")
async def get_ledger(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the full ordered ledger plus chain validity flag."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    entries = (
        db.query(Ledger)
        .options(joinedload(Ledger.from_user))
        .filter(Ledger.case_id == case_id)
        .order_by(Ledger.timestamp.asc())
        .all()
    )

    chain_valid = ledger_service.verify_chain(entries)
    ledger_responses = [LedgerEntryResponse(**_to_ledger_response(e)) for e in entries]

    return {"entries": ledger_responses, "chain_valid": chain_valid}


@router.get("/{case_id}/transparency", response_model=TransparencyResponse)
async def get_transparency(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full transparency report for a case."""
    case = (
        db.query(Case)
        .options(
            joinedload(Case.milestones),
            joinedload(Case.ledger_entries).joinedload(Ledger.from_user),
        )
        .filter(Case.id == case_id)
        .first()
    )
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    entries_ordered = sorted(case.ledger_entries, key=lambda e: e.timestamp)
    chain_integrity = ledger_service.verify_chain(entries_ordered)

    contributor_count = _case_contributor_count(db, case.id)
    anon_count = _anonymous_count(db, case.id)

    milestones = [MilestoneResponse.model_validate(m) for m in case.milestones]
    ledger_responses = [LedgerEntryResponse(**_to_ledger_response(e)) for e in entries_ordered]

    return TransparencyResponse(
        case_id=case.id,
        title=case.title,
        status=case.status,
        total_funds=case.total_funds,
        contributor_count=contributor_count,
        anonymous_count=anon_count,
        chain_integrity=chain_integrity,
        milestones=milestones,
        ledger=ledger_responses,
    )


@router.post("/{case_id}/milestones", status_code=status.HTTP_201_CREATED, response_model=MilestoneResponse)
async def add_milestone(
    case_id: UUID,
    body: AddMilestoneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a milestone to a case (NGO only)."""
    if current_user.user_type != "ngo":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only NGO users can add milestones")

    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    milestone = Milestone(
        case_id=case.id,
        title=body.title,
        description=body.description,
        status=MilestoneStatus.pending,
        created_by=current_user.id,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return MilestoneResponse.model_validate(milestone)


@router.put("/{case_id}/milestones/{milestone_id}/complete", response_model=MilestoneResponse)
async def complete_milestone(
    case_id: UUID,
    milestone_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a milestone as completed (NGO only). Auto-resolves case when all milestones done."""
    if current_user.user_type != "ngo":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only NGO users can complete milestones")

    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    milestone = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.case_id == case_id)
        .first()
    )
    if not milestone:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")

    if milestone.status == MilestoneStatus.completed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Milestone is already completed")

    milestone.status = MilestoneStatus.completed
    milestone.completed_at = datetime.now(timezone.utc)
    db.flush()

    # Record milestone ledger entry
    ledger_service.create_ledger_entry(
        db=db,
        case_id=case.id,
        transaction_type=LedgerType.milestone,
        from_user_id=current_user.id,
        amount=0,
        note=f"Milestone completed: {milestone.title}",
        is_anonymous=False,
    )

    # Check if all milestones are now completed → resolve case
    all_milestones = db.query(Milestone).filter(Milestone.case_id == case_id).all()
    all_done = all(m.status == MilestoneStatus.completed for m in all_milestones)

    if all_done and case.status != CaseStatus.resolved:
        case.status = CaseStatus.resolved
        db.flush()
        ledger_service.create_ledger_entry(
            db=db,
            case_id=case.id,
            transaction_type=LedgerType.verification,
            from_user_id=current_user.id,
            amount=0,
            note="All milestones completed — case resolved",
            is_anonymous=False,
        )

    db.refresh(milestone)
    return MilestoneResponse.model_validate(milestone)


@router.put("/{case_id}/status")
async def update_case_status(
    case_id: UUID,
    body: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update case status (NGO only)."""
    if current_user.user_type != "ngo":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only NGO users can update case status")

    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    case.status = body.status
    db.flush()

    ledger_service.create_ledger_entry(
        db=db,
        case_id=case.id,
        transaction_type=LedgerType.verification,
        from_user_id=current_user.id,
        amount=0,
        note=f"Status updated to {body.status.value}",
        is_anonymous=False,
    )

    return {"status": body.status}
