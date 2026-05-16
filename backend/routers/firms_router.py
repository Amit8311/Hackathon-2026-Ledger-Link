from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from database import get_db
from models.models import AccountingFirm, User, UserRole
from auth import get_password_hash, require_platform_admin, get_current_user

router = APIRouter(prefix="/api/firms", tags=["firms"])


class FirmCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    admin_name: str
    admin_email: EmailStr
    admin_password: str


class FirmResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/", response_model=FirmResponse)
def create_firm(
    data: FirmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    firm_email  = data.email.lower().strip()
    admin_email = data.admin_email.lower().strip()

    if db.query(AccountingFirm).filter(AccountingFirm.email == firm_email).first():
        raise HTTPException(status_code=400, detail="Firm email already exists")
    if db.query(User).filter(User.email == admin_email).first():
        raise HTTPException(status_code=400, detail="Admin email already exists")

    firm = AccountingFirm(name=data.name, email=firm_email, phone=data.phone, address=data.address)
    db.add(firm)
    db.flush()

    admin = User(
        name=data.admin_name,
        email=admin_email,
        hashed_password=get_password_hash(data.admin_password),
        role=UserRole.FIRM_ADMIN.value,
        firm_id=firm.id,
    )
    db.add(admin)
    db.commit()
    db.refresh(firm)
    return firm


@router.get("/", response_model=List[FirmResponse])
def list_firms(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    return db.query(AccountingFirm).all()


@router.get("/{firm_id}", response_model=FirmResponse)
def get_firm(
    firm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    firm = db.query(AccountingFirm).filter(AccountingFirm.id == firm_id).first()
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
    return firm


@router.patch("/{firm_id}/toggle")
def toggle_firm(
    firm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin),
):
    firm = db.query(AccountingFirm).filter(AccountingFirm.id == firm_id).first()
    if not firm:
        raise HTTPException(status_code=404, detail="Firm not found")
    firm.is_active = not firm.is_active
    db.commit()
    return {"is_active": firm.is_active}
