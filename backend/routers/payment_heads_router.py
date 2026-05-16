from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models.models import PaymentHead, PaymentSubHead, User, UserRole
from auth import require_firm_admin, get_current_user

router = APIRouter(prefix="/api/payment-heads", tags=["payment-heads"])


class SubHeadCreate(BaseModel):
    name: str
    description: Optional[str] = None


class SubHeadResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    head_id: int

    class Config:
        from_attributes = True


class PaymentHeadCreate(BaseModel):
    name: str
    description: Optional[str] = None
    company_id: int
    sub_heads: Optional[List[SubHeadCreate]] = []


class PaymentHeadResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    company_id: int
    sub_heads: List[SubHeadResponse] = []

    class Config:
        from_attributes = True


@router.post("/", response_model=PaymentHeadResponse)
def create_payment_head(
    data: PaymentHeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_admin),
):
    head = PaymentHead(name=data.name, description=data.description, company_id=data.company_id)
    db.add(head)
    db.flush()

    for sub in (data.sub_heads or []):
        db.add(PaymentSubHead(name=sub.name, description=sub.description, head_id=head.id))

    db.commit()
    db.refresh(head)
    return head


@router.get("/company/{company_id}", response_model=List[PaymentHeadResponse])
def list_payment_heads(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(PaymentHead).filter(PaymentHead.company_id == company_id).all()


@router.post("/{head_id}/sub-heads", response_model=SubHeadResponse)
def add_sub_head(
    head_id: int,
    data: SubHeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_admin),
):
    head = db.query(PaymentHead).filter(PaymentHead.id == head_id).first()
    if not head:
        raise HTTPException(status_code=404, detail="Payment head not found")
    sub = PaymentSubHead(name=data.name, description=data.description, head_id=head_id)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{head_id}")
def delete_payment_head(
    head_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_admin),
):
    head = db.query(PaymentHead).filter(PaymentHead.id == head_id).first()
    if not head:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(head)
    db.commit()
    return {"detail": "Deleted"}
