import shutil
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.models import Report, User, UserRole
from auth import require_accountant, get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

UPLOAD_DIR = Path("uploads/reports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ReportResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    file_name: str
    report_type: str
    company_id: int
    uploaded_by: int

    class Config:
        from_attributes = True


@router.post("/", response_model=ReportResponse)
async def upload_report(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    report_type: str = Form("MIS"),
    company_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_accountant),
):
    file_path = UPLOAD_DIR / f"{current_user.id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    report = Report(
        title=title,
        description=description,
        file_path=str(file_path),
        file_name=file.filename,
        report_type=report_type,
        company_id=company_id,
        uploaded_by=current_user.id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/company/{company_id}", response_model=List[ReportResponse])
def list_reports(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Report).filter(Report.company_id == company_id).order_by(Report.id.desc()).all()


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if not Path(report.file_path).exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(report.file_path, filename=report.file_name)
