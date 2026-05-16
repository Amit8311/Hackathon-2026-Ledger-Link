from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models.models import Notification, User
from auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationOut(BaseModel):
    id: int
    transaction_id: Optional[int]
    message: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationOut])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.id.desc())
        .limit(50)
        .all()
    )
    return [
        NotificationOut(
            id=n.id,
            transaction_id=n.transaction_id,
            message=n.message,
            is_read=n.is_read,
            created_at=str(n.created_at),
        )
        for n in notifs
    ]

@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}

@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}

@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
