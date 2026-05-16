from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import engine, SessionLocal
from models.models import Base, User, UserRole
from auth import get_password_hash

from routers import (
    auth_router,
    firms_router,
    companies_router,
    users_router,
    payment_heads_router,
    transactions_router,
    review_router,
    reports_router,
    stats_router,
)
from routers import forgot_password_router

Base.metadata.create_all(bind=engine)

# Add profile_photo column if it doesn't exist (for existing DBs)
from sqlalchemy import text
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN profile_photo TEXT"))
        conn.commit()
    except Exception:
        pass  # Column already exists

app = FastAPI(title="LedgerLink API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(firms_router.router)
app.include_router(companies_router.router)
app.include_router(users_router.router)
app.include_router(payment_heads_router.router)
app.include_router(transactions_router.router)
app.include_router(review_router.router)
app.include_router(reports_router.router)
app.include_router(forgot_password_router.router)
app.include_router(stats_router.router)

Path("uploads/profiles").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


def seed_platform_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@ledgerlink.com").first()
        if not existing:
            admin = User(
                name="Platform Admin",
                email="admin@ledgerlink.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.PLATFORM_ADMIN.value,
            )
            db.add(admin)
            db.commit()
            print("[OK] Platform admin seeded: admin@ledgerlink.com / admin123")
    finally:
        db.close()


seed_platform_admin()


@app.get("/")
def root():
    return {"message": "LedgerLink API is running", "docs": "/docs"}
