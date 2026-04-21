import hashlib
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from ..models.case_funding import Case, CaseStatus, Ledger, LedgerType


def _calculate_hash(
    previous_hash: str,
    case_id: str,
    amount: str,
    ts: int,
    user_id: str,
) -> str:
    """SHA-256 hash chaining each ledger entry to the previous one."""
    data = f"{previous_hash}{case_id}{amount}{ts}{user_id}"
    return hashlib.sha256(data.encode()).hexdigest()


def create_ledger_entry(
    db: Session,
    case_id: UUID,
    transaction_type: LedgerType,
    from_user_id,
    amount: Decimal,
    note: str = None,
    is_anonymous: bool = False,
) -> Ledger:
    """
    Create a chained ledger entry for a case.

    - Fetches the last entry to build the chain (previous_hash).
    - Genesis hash is '0' * 64 when no prior entries exist.
    - For LedgerType.funding entries: adds amount to case.total_funds
      and transitions case status to CaseStatus.funded.
    - Commits and returns the new Ledger row.
    """
    # Determine previous hash for chain
    last_entry = (
        db.query(Ledger)
        .filter(Ledger.case_id == case_id)
        .order_by(Ledger.timestamp.desc())
        .first()
    )
    previous_hash = last_entry.hash if last_entry else "0" * 64

    # Capture timestamp before committing so it is stable for hash computation
    now = datetime.now(timezone.utc)
    ts_int = int(now.timestamp())

    user_id_str = str(from_user_id) if from_user_id is not None else ""
    entry_hash = _calculate_hash(
        previous_hash=previous_hash,
        case_id=str(case_id),
        amount=str(amount),
        ts=ts_int,
        user_id=user_id_str,
    )

    entry = Ledger(
        case_id=case_id,
        transaction_type=transaction_type,
        from_user_id=from_user_id,
        amount=amount,
        note=note,
        is_anonymous=is_anonymous,
        hash=entry_hash,
        previous_hash=previous_hash,
        timestamp=now,
    )
    db.add(entry)

    # Update case funds and status when a funding transaction is recorded
    if transaction_type == LedgerType.funding:
        case = db.query(Case).filter(Case.id == case_id).first()
        if case is not None:
            current_funds = case.total_funds if case.total_funds is not None else Decimal("0")
            case.total_funds = current_funds + amount
            if case.status == CaseStatus.reported or case.status == CaseStatus.verified:
                case.status = CaseStatus.funded

    db.commit()
    db.refresh(entry)
    return entry


def verify_chain(entries: list) -> bool:
    """
    Walk through an ordered list of Ledger entries (oldest → newest) and
    verify the hash chain is intact.

    Returns True if every entry's stored hash matches the recomputed hash
    using the stored timestamp (as an integer unix epoch), False otherwise.
    """
    for i, entry in enumerate(entries):
        expected_previous = entries[i - 1].hash if i > 0 else "0" * 64
        if entry.previous_hash != expected_previous:
            return False

        user_id_str = str(entry.from_user_id) if entry.from_user_id is not None else ""

        # Use the int unix timestamp that was stored at creation time
        ts_int = int(entry.timestamp.timestamp())

        recomputed = _calculate_hash(
            previous_hash=entry.previous_hash,
            case_id=str(entry.case_id),
            amount=str(entry.amount),
            ts=ts_int,
            user_id=user_id_str,
        )
        if recomputed != entry.hash:
            return False

    return True
