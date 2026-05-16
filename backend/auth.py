from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models.models import User, UserRole

SECRET_KEY = "ledgerlink-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*roles: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


def require_platform_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PLATFORM_ADMIN.value:
        raise HTTPException(status_code=403, detail="Platform admin access required")
    return current_user


def require_firm_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.FIRM_ADMIN.value, UserRole.PLATFORM_ADMIN.value]:
        raise HTTPException(status_code=403, detail="Firm admin access required")
    return current_user


def require_accountant(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ACCOUNTANT.value, UserRole.FIRM_ADMIN.value]:
        raise HTTPException(status_code=403, detail="Accountant access required")
    return current_user


def require_company_access(current_user: User = Depends(get_current_user)):
    if current_user.role not in [
        UserRole.COMPANY_ADMIN.value,
        UserRole.COMPANY_USER.value,
        UserRole.ACCOUNTANT.value,
        UserRole.FIRM_ADMIN.value,
        UserRole.PLATFORM_ADMIN.value,
    ]:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user
