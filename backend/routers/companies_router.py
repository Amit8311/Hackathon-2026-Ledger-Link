from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from database import get_db
from models.models import Company, User, UserRole, AccountingFirm
from auth import get_password_hash, require_firm_admin, get_current_user

router = APIRouter(prefix="/api/companies", tags=["companies"])


class CompanyCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    business_type: str = "other"
    gst_number: Optional[str] = None
    admin_name: str
    admin_email: EmailStr
    admin_password: str


class CompanyResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    business_type: str
    gst_number: Optional[str]
    is_active: bool
    firm_id: int

    class Config:
        from_attributes = True


@router.post("/", response_model=CompanyResponse)
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_admin),
):
    company_email = data.email.lower().strip()
    admin_email   = data.admin_email.lower().strip()

    if db.query(Company).filter(Company.email == company_email).first():
        raise HTTPException(status_code=400, detail="Company email already exists")
    if db.query(User).filter(User.email == admin_email).first():
        raise HTTPException(status_code=400, detail="Admin email already exists")

    firm_id = current_user.firm_id
    company = Company(
        name=data.name,
        email=company_email,
        phone=data.phone,
        address=data.address,
        business_type=data.business_type,
        gst_number=data.gst_number,
        firm_id=firm_id,
    )
    db.add(company)
    db.flush()

    admin = User(
        name=data.admin_name,
        email=admin_email,
        hashed_password=get_password_hash(data.admin_password),
        role=UserRole.COMPANY_ADMIN.value,
        firm_id=firm_id,
        company_id=company.id,
    )
    db.add(admin)
    db.commit()
    db.refresh(company)
    return company


@router.get("/", response_model=List[CompanyResponse])
def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.PLATFORM_ADMIN.value:
        return db.query(Company).all()
    elif current_user.role in [UserRole.FIRM_ADMIN.value, UserRole.ACCOUNTANT.value]:
        return db.query(Company).filter(Company.firm_id == current_user.firm_id).all()
    elif current_user.role in [UserRole.COMPANY_ADMIN.value, UserRole.COMPANY_USER.value]:
        return db.query(Company).filter(Company.id == current_user.company_id).all()
    return []


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/{company_id}/toggle")
def toggle_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_admin),
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.is_active = not company.is_active
    db.commit()
    return {"is_active": company.is_active}
