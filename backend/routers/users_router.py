from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from pathlib import Path
import shutil

from database import get_db
from models.models import User, UserRole
from auth import get_password_hash, verify_password, require_firm_admin, get_current_user

PROFILE_PHOTO_DIR = Path("uploads/profiles")
PROFILE_PHOTO_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    company_id: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    firm_id: Optional[int]
    company_id: Optional[int]
    profile_photo: Optional[str]

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/", response_model=UserResponse)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_admin),
):
    normalized_email = data.email.lower().strip()
    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    allowed_roles = [UserRole.ACCOUNTANT.value, UserRole.COMPANY_ADMIN.value, UserRole.COMPANY_USER.value]
    if data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Cannot create user with role: {data.role}")

    user = User(
        name=data.name,
        email=normalized_email,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        firm_id=current_user.firm_id,
        company_id=data.company_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.PLATFORM_ADMIN.value:
        return db.query(User).all()
    elif current_user.role in [UserRole.FIRM_ADMIN.value]:
        return db.query(User).filter(User.firm_id == current_user.firm_id).all()
    elif current_user.role in [UserRole.COMPANY_ADMIN.value]:
        return db.query(User).filter(User.company_id == current_user.company_id).all()
    return [current_user]


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.name = data.name.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/password")
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}


@router.post("/me/photo", response_model=UserResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP allowed")
    filename = f"user_{current_user.id}{suffix}"
    file_path = PROFILE_PHOTO_DIR / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    current_user.profile_photo = filename
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/{user_id}/toggle")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_firm_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"is_active": user.is_active}
