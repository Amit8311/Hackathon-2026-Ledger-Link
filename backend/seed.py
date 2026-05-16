"""
LedgerLink Demo Data Seeder
Run from the backend/ directory:  python seed.py
Safe to run multiple times — skips data that already exists.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
from models.models import (
    Base, User, AccountingFirm, Company, PaymentHead, PaymentSubHead,
    Transaction, UserRole, TransactionStatus, TransactionType,
)
from auth import get_password_hash
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def exists(model, **kwargs):
    return db.query(model).filter_by(**kwargs).first()

def add(obj):
    db.add(obj)
    db.flush()   # get the id without committing yet
    return obj

print("\n[SEED]  LedgerLink demo data seeder")
print("=" * 44)

# ─────────────────────────────────────────────
# 1. ACCOUNTING FIRMS
# ─────────────────────────────────────────────
FIRMS = [
    dict(name="Sharma & Associates",          email="info@sharma-associates.com",   phone="9821000001", address="12, Connaught Place, New Delhi - 110001"),
    dict(name="Mehta Chartered Accountants",  email="contact@mehtaca.com",          phone="9821000002", address="304, Nariman Point, Mumbai - 400021"),
    dict(name="Patel & Co. CPA",              email="admin@patelandco.com",         phone="9821000003", address="55, MG Road, Bengaluru - 560001"),
]

firm_objs = []
for f in FIRMS:
    obj = exists(AccountingFirm, email=f["email"])
    if not obj:
        obj = add(AccountingFirm(**f, is_active=True))
        print(f"  +  Firm: {f['name']}")
    else:
        print(f"  .  Firm already exists: {f['name']}")
    firm_objs.append(obj)

# ─────────────────────────────────────────────
# 2. FIRM ADMINS
# ─────────────────────────────────────────────
FIRM_ADMINS = [
    dict(name="Rajesh Sharma",   email="rajesh@sharma-associates.com",  firm_index=0),
    dict(name="Priya Mehta",     email="priya@mehtaca.com",             firm_index=1),
    dict(name="Nikhil Patel",    email="nikhil@patelandco.com",         firm_index=2),
]
firm_admin_objs = []
for fa in FIRM_ADMINS:
    obj = exists(User, email=fa["email"])
    if not obj:
        obj = add(User(
            name=fa["name"], email=fa["email"],
            hashed_password=get_password_hash("firm123"),
            role=UserRole.FIRM_ADMIN.value,
            firm_id=firm_objs[fa["firm_index"]].id,
            is_active=True,
        ))
        print(f"  + Firm Admin: {fa['email']}  (pw: firm123)")
    else:
        print(f"  . Firm Admin already exists: {fa['email']}")
    firm_admin_objs.append(obj)

# ─────────────────────────────────────────────
# 3. ACCOUNTANTS  (2 per firm)
# ─────────────────────────────────────────────
ACCOUNTANTS = [
    # Sharma firm
    dict(name="Amit Verma",     email="amit.verma@sharma-associates.com",   firm_index=0),
    dict(name="Sunita Joshi",   email="sunita.joshi@sharma-associates.com", firm_index=0),
    # Mehta firm
    dict(name="Karan Desai",    email="karan.desai@mehtaca.com",            firm_index=1),
    dict(name="Deepa Shah",     email="deepa.shah@mehtaca.com",             firm_index=1),
    # Patel firm
    dict(name="Rohit Nair",     email="rohit.nair@patelandco.com",          firm_index=2),
    dict(name="Meena Iyer",     email="meena.iyer@patelandco.com",          firm_index=2),
]
accountant_objs = []
for ac in ACCOUNTANTS:
    obj = exists(User, email=ac["email"])
    if not obj:
        obj = add(User(
            name=ac["name"], email=ac["email"],
            hashed_password=get_password_hash("acct123"),
            role=UserRole.ACCOUNTANT.value,
            firm_id=firm_objs[ac["firm_index"]].id,
            is_active=True,
        ))
        print(f"  + Accountant: {ac['email']}  (pw: acct123)")
    else:
        print(f"  . Accountant already exists: {ac['email']}")
    accountant_objs.append(obj)

# ─────────────────────────────────────────────
# 4. COMPANIES  (3 per firm)
# ─────────────────────────────────────────────
COMPANIES = [
    # Sharma firm companies
    dict(name="Arjun Textiles Pvt Ltd",      email="accounts@arjuntextiles.com",    phone="9900000001", address="Surat, Gujarat",        business_type="manufacturing", gst_number="24AAACA1234A1Z5", firm_index=0),
    dict(name="Sunrise IT Solutions",         email="finance@sunriseit.com",         phone="9900000002", address="Noida, UP",             business_type="it",            gst_number="09AABCS5149P1ZG", firm_index=0),
    dict(name="Green Valley Retail",          email="accounts@greenvalley.com",      phone="9900000003", address="Jaipur, Rajasthan",     business_type="retail",        gst_number="08AACFG3456K1Z2", firm_index=0),
    # Mehta firm companies
    dict(name="Coastal Pharma Ltd",           email="accounts@coastalpharma.com",    phone="9900000004", address="Ahmedabad, Gujarat",    business_type="manufacturing", gst_number="24AACCP7891B1Z3", firm_index=1),
    dict(name="BlueSky Services",             email="billing@bluesky.com",           phone="9900000005", address="Pune, Maharashtra",     business_type="services",      gst_number="27AABCB2345C1ZD", firm_index=1),
    dict(name="Horizon Logistics",            email="accounts@horizonlog.com",       phone="9900000006", address="Mumbai, Maharashtra",   business_type="other",         gst_number="27AAACH9012D1ZE", firm_index=1),
    # Patel firm companies
    dict(name="TechNova Systems",             email="accounts@technova.com",         phone="9900000007", address="Bengaluru, Karnataka",  business_type="it",            gst_number="29AAACT3456E1ZF", firm_index=2),
    dict(name="Regal Foods Pvt Ltd",          email="finance@regalfoods.com",        phone="9900000008", address="Chennai, Tamil Nadu",   business_type="manufacturing", gst_number="33AAACP6789F1ZG", firm_index=2),
    dict(name="Metro Infrastructure",         email="accounts@metroinfra.com",       phone="9900000009", address="Hyderabad, Telangana",  business_type="services",      gst_number="36AAACM0123G1ZH", firm_index=2),
]
company_objs = []
for co in COMPANIES:
    obj = exists(Company, email=co["email"])
    if not obj:
        obj = add(Company(
            name=co["name"], email=co["email"], phone=co["phone"],
            address=co["address"], business_type=co["business_type"],
            gst_number=co["gst_number"],
            firm_id=firm_objs[co["firm_index"]].id,
            is_active=True,
        ))
        print(f"  + Company: {co['name']}")
    else:
        print(f"  . Company already exists: {co['name']}")
    company_objs.append(obj)

# ─────────────────────────────────────────────
# 5. COMPANY ADMINS & USERS
# ─────────────────────────────────────────────
COMPANY_USERS = [
    dict(name="Vikram Arjun",       email="vikram@arjuntextiles.com",    role="company_admin", co_index=0),
    dict(name="Pooja Arjun",        email="pooja@arjuntextiles.com",     role="company_user",  co_index=0),
    dict(name="Anil Kumar",         email="anil@sunriseit.com",          role="company_admin", co_index=1),
    dict(name="Ritu Singh",         email="ritu@sunriseit.com",          role="company_user",  co_index=1),
    dict(name="Manish Gupta",       email="manish@greenvalley.com",      role="company_admin", co_index=2),
    dict(name="Seema Gupta",        email="seema@greenvalley.com",       role="company_user",  co_index=2),
    dict(name="Harish Coastal",     email="harish@coastalpharma.com",    role="company_admin", co_index=3),
    dict(name="Lakshmi Coastal",    email="lakshmi@coastalpharma.com",   role="company_user",  co_index=3),
    dict(name="Sachin Blue",        email="sachin@bluesky.com",          role="company_admin", co_index=4),
    dict(name="Neha Blue",          email="neha@bluesky.com",            role="company_user",  co_index=4),
    dict(name="Farhan Horizon",     email="farhan@horizonlog.com",       role="company_admin", co_index=5),
    dict(name="Zara Horizon",       email="zara@horizonlog.com",         role="company_user",  co_index=5),
    dict(name="Suresh Tech",        email="suresh@technova.com",         role="company_admin", co_index=6),
    dict(name="Divya Tech",         email="divya@technova.com",          role="company_user",  co_index=6),
    dict(name="Rahul Regal",        email="rahul@regalfoods.com",        role="company_admin", co_index=7),
    dict(name="Kavya Regal",        email="kavya@regalfoods.com",        role="company_user",  co_index=7),
    dict(name="Arjun Metro",        email="arjun@metroinfra.com",        role="company_admin", co_index=8),
    dict(name="Preethi Metro",      email="preethi@metroinfra.com",      role="company_user",  co_index=8),
]
company_user_objs = []
for cu in COMPANY_USERS:
    role_enum = UserRole.COMPANY_ADMIN if cu["role"] == "company_admin" else UserRole.COMPANY_USER
    pw = "cadmin123" if cu["role"] == "company_admin" else "cuser123"
    obj = exists(User, email=cu["email"])
    if not obj:
        obj = add(User(
            name=cu["name"], email=cu["email"],
            hashed_password=get_password_hash(pw),
            role=role_enum.value,
            company_id=company_objs[cu["co_index"]].id,
            firm_id=company_objs[cu["co_index"]].firm_id,
            is_active=True,
        ))
        print(f"  + {cu['role']}: {cu['email']}  (pw: {pw})")
    else:
        print(f"  . User already exists: {cu['email']}")
    company_user_objs.append(obj)

# ─────────────────────────────────────────────
# 6. PAYMENT HEADS
# ─────────────────────────────────────────────
PAYMENT_HEADS = [
    dict(co_index=0, name="Raw Material Purchases", desc="Cotton, yarn, fabric procurement",
         subs=["Cotton Yarn", "Fabric Rolls", "Dyes & Chemicals"]),
    dict(co_index=0, name="Salary & Wages",          desc="Employee compensation",
         subs=["Factory Workers", "Supervisors", "Admin Staff"]),
    dict(co_index=1, name="Software & Licenses",     desc="Technology expenses",
         subs=["Cloud Services", "SaaS Tools", "Developer Licenses"]),
    dict(co_index=1, name="Infrastructure",           desc="Hardware and office",
         subs=["Servers", "Office Rent", "Utilities"]),
    dict(co_index=2, name="Inventory Purchase",       desc="Stock procurement",
         subs=["FMCG Goods", "Electronics", "Stationery"]),
    dict(co_index=3, name="API & Raw Materials",      desc="Pharmaceutical raw materials",
         subs=["Active Pharma Ingredients", "Excipients", "Packaging"]),
    dict(co_index=4, name="Operations",               desc="Day-to-day expenses",
         subs=["Travel", "Communication", "Office Supplies"]),
    dict(co_index=6, name="R&D Expenses",             desc="Research and development",
         subs=["Prototyping", "Testing", "Patents"]),
    dict(co_index=7, name="Production Costs",         desc="Food manufacturing expenses",
         subs=["Ingredients", "Packaging Material", "Cold Storage"]),
]
ph_objs = {}
for ph in PAYMENT_HEADS:
    co_id = company_objs[ph["co_index"]].id
    obj = exists(PaymentHead, name=ph["name"], company_id=co_id)
    if not obj:
        obj = add(PaymentHead(name=ph["name"], description=ph["desc"], company_id=co_id))
        for sub in ph["subs"]:
            if not exists(PaymentSubHead, name=sub, head_id=obj.id):
                add(PaymentSubHead(name=sub, head_id=obj.id))
        print(f"  + Payment Head: {ph['name']}")
    else:
        print(f"  . Payment Head already exists: {ph['name']}")
    ph_objs[ph["name"]] = obj

# ─────────────────────────────────────────────
# 7. TRANSACTIONS
# ─────────────────────────────────────────────
VENDORS = [
    "Reliance Industries", "Tata Steel", "Infosys", "HCL Technologies",
    "Wipro Ltd", "Bajaj Auto", "Asian Paints", "Marico Ltd",
    "Dr Reddy's Labs", "Sun Pharma", "Hindustan Unilever", "ITC Ltd",
    "Godrej Consumer", "Dabur India", "Nestle India", "Britannia Industries",
    "Larsen & Toubro", "Bharat Electronics", "NTPC Ltd", "Power Grid Corp",
]
TYPES = [
    TransactionType.PURCHASE_INVOICE.value,
    TransactionType.SALES_INVOICE.value,
    TransactionType.PAYMENT.value,
    TransactionType.SALARY_REGISTER.value,
    TransactionType.BANK_STATEMENT.value,
    TransactionType.LEDGER.value,
]
STATUSES = [
    TransactionStatus.PENDING.value,
    TransactionStatus.PENDING.value,      # more pending for demo
    TransactionStatus.UNDER_REVIEW.value,
    TransactionStatus.ACCEPTED.value,
    TransactionStatus.ACCEPTED.value,
    TransactionStatus.REJECTED.value,
]

random.seed(42)   # deterministic so re-runs produce the same data

def make_invoice_no():
    return f"INV-{random.randint(1000,9999)}/{random.randint(23,24)}"

def make_date(days_ago):
    d = datetime.now() - timedelta(days=days_ago)
    return d.strftime("%Y-%m-%d")

tx_count = 0
for ci, co in enumerate(company_objs):
    # Find a company-admin uploader for this company
    uploader = next(
        (u for u in company_user_objs if u.company_id == co.id and u.role == UserRole.COMPANY_ADMIN.value),
        None
    )
    # Find an accountant from the same firm
    reviewer = next(
        (u for u in accountant_objs if u.firm_id == co.firm_id),
        None
    )
    if not uploader:
        continue

    for i in range(12):   # 12 transactions per company
        vendor  = random.choice(VENDORS)
        tx_type = random.choice(TYPES)
        status  = random.choice(STATUSES)
        amount  = round(random.uniform(10000, 500000), 2)
        tax     = round(amount * random.choice([0, 0.05, 0.12, 0.18]), 2)
        total   = round(amount + tax, 2)
        days_ago = random.randint(1, 90)

        inv_no = make_invoice_no() if tx_type in [
            TransactionType.PURCHASE_INVOICE.value,
            TransactionType.SALES_INVOICE.value,
        ] else None

        fname = f"{tx_type.replace('_','-')}-{make_invoice_no().replace('/','-')}.pdf"

        # Check by unique enough combo (vendor + amount + company)
        already = db.query(Transaction).filter_by(
            company_id=co.id, vendor_name=vendor, total_amount=total
        ).first()
        if already:
            continue

        reviewed_by_id = reviewer.id if status in [
            TransactionStatus.ACCEPTED.value,
            TransactionStatus.REJECTED.value,
            TransactionStatus.UNDER_REVIEW.value,
        ] and reviewer else None

        notes = None
        if status == TransactionStatus.REJECTED.value:
            notes = random.choice([
                "Duplicate invoice detected.",
                "Vendor GST number mismatch.",
                "Amount exceeds approved limit.",
                "Missing supporting documents.",
            ])
        elif status == TransactionStatus.ACCEPTED.value:
            notes = "Verified and approved."

        t = Transaction(
            transaction_type=tx_type,
            vendor_name=vendor,
            invoice_number=inv_no,
            invoice_date=make_date(days_ago + 2),
            amount=amount,
            tax_amount=tax,
            total_amount=total,
            description=f"{tx_type.replace('_',' ').title()} from {vendor}",
            status=status,
            ai_extracted=random.choice([True, False]),
            reviewer_notes=notes,
            file_path=f"uploads/transactions/{fname}",
            file_name=fname,
            company_id=co.id,
            uploaded_by=uploader.id,
            reviewed_by=reviewed_by_id,
        )
        db.add(t)
        tx_count += 1

print(f"  + Transactions: {tx_count} created across {len(company_objs)} companies")

# ─────────────────────────────────────────────
# COMMIT
# ─────────────────────────────────────────────
db.commit()
db.close()

print("\n[DONE]  Seeding complete!\n")
print("Credentials summary")
print("-" * 44)
print("Platform Admin : admin@ledgerlink.com        / admin123")
print("Firm Admins    : rajesh@sharma-associates.com/ firm123")
print("               : priya@mehtaca.com           / firm123")
print("               : nikhil@patelandco.com       / firm123")
print("Accountants    : amit.verma@sharma-associates.com / acct123")
print("               : karan.desai@mehtaca.com         / acct123")
print("               : rohit.nair@patelandco.com        / acct123")
print("Company Admins : vikram@arjuntextiles.com    / cadmin123")
print("               : anil@sunriseit.com          / cadmin123")
print("               : harish@coastalpharma.com    / cadmin123")
print("Company Users  : pooja@arjuntextiles.com     / cuser123")
print("               : ritu@sunriseit.com          / cuser123")
print("-" * 44)
