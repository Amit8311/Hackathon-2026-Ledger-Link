from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.models import AuditLog, User, UserRole, Company
from auth import get_current_user

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/")
def get_audit_logs(
    limit: int = Query(100, le=500),
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (
        UserRole.PLATFORM_ADMIN.value, UserRole.FIRM_ADMIN.value
    ):
        return []

    q = db.query(AuditLog)

    if current_user.role == UserRole.FIRM_ADMIN.value:
        # Only show logs for users in this firm's companies
        firm_company_ids = [
            row[0] for row in
            db.query(Company.id).filter(Company.firm_id == current_user.firm_id).all()
        ]
        # We filter by user_ids that belong to this firm
        firm_user_ids = [
            row[0] for row in
            db.query(User.id).filter(
                (User.firm_id == current_user.firm_id) |
                (User.company_id.in_(firm_company_ids))
            ).all()
        ]
        q = q.filter(AuditLog.user_id.in_(firm_user_ids))

    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)

    logs = q.order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_name": log.user_name,
            "user_role": log.user_role,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": str(log.created_at),
        }
        for log in logs
    ]
