from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class UserRole(str, enum.Enum):
    PLATFORM_ADMIN = "platform_admin"
    FIRM_ADMIN = "firm_admin"
    ACCOUNTANT = "accountant"
    COMPANY_ADMIN = "company_admin"
    COMPANY_USER = "company_user"


class BusinessType(str, enum.Enum):
    MANUFACTURING = "manufacturing"
    IT = "it"
    SERVICES = "services"
    RETAIL = "retail"
    OTHER = "other"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class TransactionType(str, enum.Enum):
    PURCHASE_INVOICE = "purchase_invoice"
    SALES_INVOICE = "sales_invoice"
    PAYMENT = "payment"
    SALARY_REGISTER = "salary_register"
    BANK_STATEMENT = "bank_statement"
    LEDGER = "ledger"


class AccountingFirm(Base):
    __tablename__ = "accounting_firms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String)
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="firm")
    companies = relationship("Company", back_populates="firm")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String)
    address = Column(Text)
    business_type = Column(String, default=BusinessType.OTHER)
    gst_number = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    firm_id = Column(Integer, ForeignKey("accounting_firms.id"), nullable=False)
    firm = relationship("AccountingFirm", back_populates="companies")
    users = relationship("User", back_populates="company")
    payment_heads = relationship("PaymentHead", back_populates="company")
    transactions = relationship("Transaction", back_populates="company")
    reports = relationship("Report", back_populates="company")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile_photo = Column(String, nullable=True)
    firm_id = Column(Integer, ForeignKey("accounting_firms.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)

    firm = relationship("AccountingFirm", back_populates="users")
    company = relationship("Company", back_populates="users")
    uploaded_transactions = relationship("Transaction", back_populates="uploaded_by_user", foreign_keys="Transaction.uploaded_by")
    reviewed_transactions = relationship("Transaction", back_populates="reviewed_by_user", foreign_keys="Transaction.reviewed_by")


class PaymentHead(Base):
    __tablename__ = "payment_heads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="payment_heads")
    sub_heads = relationship("PaymentSubHead", back_populates="head")
    transactions = relationship("Transaction", back_populates="payment_head")


class PaymentSubHead(Base):
    __tablename__ = "payment_sub_heads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    head_id = Column(Integer, ForeignKey("payment_heads.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    head = relationship("PaymentHead", back_populates="sub_heads")
    transactions = relationship("Transaction", back_populates="payment_sub_head")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_type = Column(String, nullable=False)
    vendor_name = Column(String)
    invoice_number = Column(String)
    invoice_date = Column(String)
    amount = Column(Float)
    tax_amount = Column(Float, default=0)
    total_amount = Column(Float)
    description = Column(Text)
    status = Column(String, default=TransactionStatus.PENDING)
    ai_extracted = Column(Boolean, default=False)
    raw_ai_response = Column(Text)
    reviewer_notes = Column(Text)
    file_path = Column(String)
    file_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    payment_head_id = Column(Integer, ForeignKey("payment_heads.id"), nullable=True)
    payment_sub_head_id = Column(Integer, ForeignKey("payment_sub_heads.id"), nullable=True)

    company = relationship("Company", back_populates="transactions")
    uploaded_by_user = relationship("User", back_populates="uploaded_transactions", foreign_keys=[uploaded_by])
    reviewed_by_user = relationship("User", back_populates="reviewed_transactions", foreign_keys=[reviewed_by])
    payment_head = relationship("PaymentHead", back_populates="transactions")
    payment_sub_head = relationship("PaymentSubHead", back_populates="transactions")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    report_type = Column(String, default="MIS")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    company = relationship("Company", back_populates="reports")


class Notification(Base):
    __tablename__ = "notifications"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    message     = Column(String, nullable=False)
    is_read     = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name   = Column(String, nullable=False)
    user_role   = Column(String, nullable=False)
    action      = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id   = Column(Integer, nullable=True)
    details     = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
