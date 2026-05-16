import os
import shutil
import json
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.models import Transaction, TransactionStatus, User, UserRole, Company
from auth import get_current_user, require_company_access
from services.ai_service import extract_invoice_data

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

UPLOAD_DIR = Path("uploads/transactions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}


class TransactionUpdate(BaseModel):
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    amount: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    description: Optional[str] = None
    payment_head_id: Optional[int] = None
    payment_sub_head_id: Optional[int] = None
    transaction_type: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    transaction_type: str
    vendor_name: Optional[str]
    invoice_number: Optional[str]
    invoice_date: Optional[str]
    amount: Optional[float]
    tax_amount: Optional[float]
    total_amount: Optional[float]
    description: Optional[str]
    status: str
    ai_extracted: bool
    reviewer_notes: Optional[str]
    file_name: Optional[str]
    company_id: int
    uploaded_by: int
    reviewed_by: Optional[int]
    payment_head_id: Optional[int]
    payment_sub_head_id: Optional[int]

    class Config:
        from_attributes = True


@router.post("/upload", response_model=TransactionResponse)
async def upload_transaction(
    file: UploadFile = File(...),
    transaction_type: str = Form(...),
    company_id: int = Form(...),
    use_ai: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_company_access),
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {suffix} not allowed")

    file_path = UPLOAD_DIR / f"{current_user.id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    transaction = Transaction(
        transaction_type=transaction_type,
        company_id=company_id,
        uploaded_by=current_user.id,
        file_path=str(file_path),
        file_name=file.filename,
        status=TransactionStatus.PENDING.value,
    )

    if use_ai and suffix in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        try:
            extracted = extract_invoice_data(str(file_path))
            if "error" not in extracted and "parse_error" not in extracted:
                transaction.vendor_name = extracted.get("vendor_name")
                transaction.invoice_number = extracted.get("invoice_number")
                transaction.invoice_date = extracted.get("invoice_date")
                transaction.amount = extracted.get("amount")
                transaction.tax_amount = extracted.get("tax_amount") or 0
                transaction.total_amount = extracted.get("total_amount")
                transaction.description = extracted.get("description")
                if extracted.get("transaction_type"):
                    transaction.transaction_type = extracted["transaction_type"]
                transaction.ai_extracted = True
            transaction.raw_ai_response = json.dumps(extracted)
        except Exception as e:
            transaction.raw_ai_response = json.dumps({"error": str(e)})

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    company_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction)

    if current_user.role in [UserRole.COMPANY_ADMIN.value, UserRole.COMPANY_USER.value]:
        query = query.filter(Transaction.company_id == current_user.company_id)
    elif current_user.role in [UserRole.ACCOUNTANT.value, UserRole.FIRM_ADMIN.value]:
        if company_id:
            query = query.filter(Transaction.company_id == company_id)
        elif current_user.firm_id:
            firm_company_ids = [row[0] for row in db.query(Company.id).filter(Company.firm_id == current_user.firm_id).all()]
            query = query.filter(Transaction.company_id.in_(firm_company_ids))
    elif current_user.role == UserRole.PLATFORM_ADMIN.value:
        if company_id:
            query = query.filter(Transaction.company_id == company_id)

    if status:
        query = query.filter(Transaction.status == status)

    return query.order_by(Transaction.id.desc()).all()


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx


@router.post("/{transaction_id}/manual", response_model=TransactionResponse)
def create_manual_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx
