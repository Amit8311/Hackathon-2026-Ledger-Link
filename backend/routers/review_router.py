from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.models import Transaction, TransactionStatus, User
from auth import require_accountant, get_current_user

router = APIRouter(prefix="/api/review", tags=["review"])


class ReviewAction(BaseModel):
    action: str  # "accept" | "reject"
    notes: Optional[str] = None
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    amount: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    description: Optional[str] = None
    payment_head_id: Optional[int] = None
    payment_sub_head_id: Optional[int] = None


@router.post("/{transaction_id}")
def review_transaction(
    transaction_id: int,
    data: ReviewAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if data.action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'reject'")

    # Apply any field corrections
    for field in ["vendor_name", "invoice_number", "invoice_date", "amount",
                  "tax_amount", "total_amount", "description", "payment_head_id", "payment_sub_head_id"]:
        value = getattr(data, field, None)
        if value is not None:
            setattr(tx, field, value)

    tx.status = TransactionStatus.ACCEPTED.value if data.action == "accept" else TransactionStatus.REJECTED.value
    tx.reviewed_by = current_user.id
    tx.reviewer_notes = data.notes

    db.commit()
    db.refresh(tx)
    return {
        "id": tx.id,
        "status": tx.status,
        "reviewed_by": tx.reviewed_by,
        "reviewer_notes": tx.reviewer_notes,
    }


@router.patch("/{transaction_id}/mark-review")
def mark_under_review(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Not found")
    tx.status = TransactionStatus.UNDER_REVIEW.value
    tx.reviewed_by = current_user.id
    db.commit()
    return {"status": tx.status}
