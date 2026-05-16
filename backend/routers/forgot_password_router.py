import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db
from models.models import User
from auth import get_password_hash
from services.email_service import send_temp_password_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


def generate_temp_password(length=10) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        # Return success anyway to prevent email enumeration
        return {"message": "If this email is registered, a temporary password has been sent."}

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled. Contact your administrator.")

    temp_password = generate_temp_password()

    try:
        send_temp_password_email(user.email, user.name, temp_password)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    user.hashed_password = get_password_hash(temp_password)
    db.commit()

    return {"message": "Temporary password sent to your email."}
