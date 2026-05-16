from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict
from datetime import datetime, timedelta

from database import get_db
from models.models import (
    AccountingFirm, Company, User, Transaction, UserRole, TransactionStatus
)
from auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _last_n_months(n: int):
    """Return a list of 'YYYY-MM' strings for the last n months (oldest first)."""
    result = []
    today = datetime.today()
    for i in range(n - 1, -1, -1):
        dt = today.replace(day=1) - timedelta(days=1) if i else today
        # go back i months
        month = today.month - i
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        result.append(f"{year:04d}-{month:02d}")
    return result


# ── Platform Admin ─────────────────────────────────────────────────────────────

@router.get("/platform")
def platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    firms = db.query(AccountingFirm).all()
    companies = db.query(Company).all()
    transactions = db.query(Transaction).all()
    users = db.query(User).filter(User.role != UserRole.PLATFORM_ADMIN.value).all()

    # Transactions per firm (bar chart)
    firm_tx_map = defaultdict(lambda: {"count": 0, "amount": 0.0})
    for tx in transactions:
        co = db.query(Company).filter_by(id=tx.company_id).first()
        if co:
            firm = db.query(AccountingFirm).filter_by(id=co.firm_id).first()
            if firm:
                firm_tx_map[firm.name]["count"] += 1
                firm_tx_map[firm.name]["amount"] += tx.total_amount or 0

    firms_bar = [
        {"name": name[:18], "transactions": v["count"], "amount": round(v["amount"] / 1000, 1)}
        for name, v in firm_tx_map.items()
    ]

    # Status distribution (pie chart)
    status_counts = defaultdict(int)
    for tx in transactions:
        status_counts[tx.status] += 1

    status_pie = [
        {"name": s.replace("_", " ").title(), "value": c}
        for s, c in status_counts.items()
    ]

    return {
        "total_firms":        len(firms),
        "active_firms":       sum(1 for f in firms if f.is_active),
        "total_companies":    len(companies),
        "total_users":        len(users),
        "total_transactions": len(transactions),
        "firms_bar":          firms_bar,
        "status_pie":         status_pie,
    }


# ── Firm Admin ────────────────────────────────────────────────────────────────

@router.get("/firm")
def firm_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    firm_id = current_user.firm_id
    companies = db.query(Company).filter_by(firm_id=firm_id).all()
    co_ids = [c.id for c in companies]

    transactions = db.query(Transaction).filter(Transaction.company_id.in_(co_ids)).all() if co_ids else []
    accountants = db.query(User).filter_by(firm_id=firm_id, role=UserRole.ACCOUNTANT.value).all()

    # Per-company status breakdown (stacked bar)
    co_map = {c.id: c.name for c in companies}
    co_stats = defaultdict(lambda: {"pending": 0, "under_review": 0, "accepted": 0, "rejected": 0})
    for tx in transactions:
        key = co_map.get(tx.company_id, str(tx.company_id))[:14]
        status = tx.status if tx.status in ("pending", "under_review", "accepted", "rejected") else "pending"
        co_stats[key][status] += 1

    companies_bar = [
        {"name": name, **counts}
        for name, counts in co_stats.items()
    ]

    # Monthly transaction trend (last 6 months)
    months = _last_n_months(6)
    monthly = {m: {"month": m[-2:] + "/" + m[:4][-2:], "count": 0} for m in months}
    for tx in transactions:
        if tx.invoice_date:
            ym = tx.invoice_date[:7]
            if ym in monthly:
                monthly[ym]["count"] += 1

    return {
        "total_companies":    len(companies),
        "active_companies":   sum(1 for c in companies if c.is_active),
        "total_accountants":  len(accountants),
        "total_transactions": len(transactions),
        "pending":            sum(1 for t in transactions if t.status == TransactionStatus.PENDING.value),
        "under_review":       sum(1 for t in transactions if t.status == TransactionStatus.UNDER_REVIEW.value),
        "accepted":           sum(1 for t in transactions if t.status == TransactionStatus.ACCEPTED.value),
        "rejected":           sum(1 for t in transactions if t.status == TransactionStatus.REJECTED.value),
        "companies_bar":      companies_bar,
        "monthly_trend":      list(monthly.values()),
    }


# ── Accountant ────────────────────────────────────────────────────────────────

@router.get("/accountant")
def accountant_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    firm_id = current_user.firm_id
    companies = db.query(Company).filter_by(firm_id=firm_id).all()
    co_ids = [c.id for c in companies]

    transactions = db.query(Transaction).filter(Transaction.company_id.in_(co_ids)).all() if co_ids else []

    # Status pie
    status_counts = defaultdict(int)
    for tx in transactions:
        status_counts[tx.status] += 1

    status_pie = [
        {"name": s.replace("_", " ").title(), "value": c}
        for s, c in status_counts.items()
    ]

    # Per-company breakdown (bar)
    co_map = {c.id: c.name for c in companies}
    co_stats = defaultdict(lambda: {"pending": 0, "accepted": 0, "rejected": 0})
    for tx in transactions:
        key = co_map.get(tx.company_id, str(tx.company_id))[:14]
        if tx.status in ("pending", "accepted", "rejected"):
            co_stats[key][tx.status] += 1

    companies_bar = [{"name": k, **v} for k, v in co_stats.items()]

    return {
        "total_transactions": len(transactions),
        "pending":      status_counts.get(TransactionStatus.PENDING.value, 0),
        "under_review": status_counts.get(TransactionStatus.UNDER_REVIEW.value, 0),
        "accepted":     status_counts.get(TransactionStatus.ACCEPTED.value, 0),
        "rejected":     status_counts.get(TransactionStatus.REJECTED.value, 0),
        "status_pie":    status_pie,
        "companies_bar": companies_bar,
    }


# ── Company ────────────────────────────────────────────────────────────────────

@router.get("/company")
def company_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    co_id = current_user.company_id
    transactions = db.query(Transaction).filter_by(company_id=co_id).all() if co_id else []

    status_counts = defaultdict(int)
    for tx in transactions:
        status_counts[tx.status] += 1

    # Status pie
    status_pie = [
        {"name": s.replace("_", " ").title(), "value": c}
        for s, c in status_counts.items()
    ]

    # Transaction type breakdown
    type_counts = defaultdict(int)
    for tx in transactions:
        type_counts[tx.transaction_type] += 1

    type_bar = [
        {"name": t.replace("_", " ").title()[:12], "count": c}
        for t, c in type_counts.items()
    ]

    # Monthly spend trend (last 6 months)
    months = _last_n_months(6)
    monthly = {m: {"month": m[-2:] + "/" + m[:4][-2:], "amount": 0.0} for m in months}
    for tx in transactions:
        if tx.invoice_date and tx.status == TransactionStatus.ACCEPTED.value:
            ym = tx.invoice_date[:7]
            if ym in monthly:
                monthly[ym]["amount"] = round(monthly[ym]["amount"] + (tx.total_amount or 0), 2)

    total_amount    = sum(tx.total_amount or 0 for tx in transactions)
    accepted_amount = sum(tx.total_amount or 0 for tx in transactions if tx.status == TransactionStatus.ACCEPTED.value)

    return {
        "total_transactions": len(transactions),
        "pending":            status_counts.get(TransactionStatus.PENDING.value, 0),
        "under_review":       status_counts.get(TransactionStatus.UNDER_REVIEW.value, 0),
        "accepted":           status_counts.get(TransactionStatus.ACCEPTED.value, 0),
        "rejected":           status_counts.get(TransactionStatus.REJECTED.value, 0),
        "total_amount":       round(total_amount, 2),
        "accepted_amount":    round(accepted_amount, 2),
        "status_pie":         status_pie,
        "type_bar":           type_bar,
        "monthly_trend":      list(monthly.values()),
    }


@router.get("/insights")
def company_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from models.models import PaymentHead
    co_id = current_user.company_id
    if not co_id:
        return {"top_heads": [], "cash_flow": [], "doc_types": []}

    accepted_txns = db.query(Transaction).filter(
        Transaction.company_id == co_id,
        Transaction.status == TransactionStatus.ACCEPTED.value,
    ).all()

    # Top expense heads
    head_totals = defaultdict(float)
    for tx in accepted_txns:
        if tx.payment_head_id:
            head = db.query(PaymentHead).filter_by(id=tx.payment_head_id).first()
            label = head.name if head else f"Head #{tx.payment_head_id}"
        else:
            label = "Uncategorised"
        head_totals[label] += tx.total_amount or 0

    top_heads = sorted(
        [{"name": k[:16], "amount": round(v, 2)} for k, v in head_totals.items()],
        key=lambda x: x["amount"], reverse=True
    )[:8]

    # Monthly cash flow — last 6 months
    months = _last_n_months(6)
    flow = {m: {"month": m[-2:] + "/" + m[:4][-2:], "income": 0.0, "expense": 0.0} for m in months}
    for tx in accepted_txns:
        if not tx.invoice_date:
            continue
        ym = tx.invoice_date[:7]
        if ym not in flow:
            continue
        amt = tx.total_amount or 0
        if tx.transaction_type in ("sales_invoice",):
            flow[ym]["income"] = round(flow[ym]["income"] + amt, 2)
        else:
            flow[ym]["expense"] = round(flow[ym]["expense"] + amt, 2)

    # Document type breakdown (all statuses)
    all_txns = db.query(Transaction).filter(Transaction.company_id == co_id).all()
    doc_types = defaultdict(int)
    for tx in all_txns:
        doc_types[tx.transaction_type.replace("_", " ").title()] += 1
    doc_type_data = [{"name": k[:14], "count": v} for k, v in doc_types.items()]

    return {
        "top_heads": top_heads,
        "cash_flow": list(flow.values()),
        "doc_types": doc_type_data,
    }
