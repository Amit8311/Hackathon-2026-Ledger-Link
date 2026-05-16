# LedgerLink

A multi-tenant financial SaaS platform that connects accounting firms, companies, and accountants through AI-powered document workflows.

---

## What it does

Companies upload financial documents (invoices, bills, vouchers). Google Gemini AI automatically extracts vendor, amount, tax, and date fields. Accountants review the extracted data, accept or reject transactions, and publish reports back to companies — all through role-specific dashboards with real-time status tracking.

---

## Roles

| Role | What they do |
|---|---|
| **Platform Admin** | Onboards and manages accounting firms |
| **Firm Admin** | Manages companies and assigns accountants |
| **Accountant** | Reviews transactions, publishes reports |
| **Company Admin / User** | Uploads documents, tracks approval status, downloads reports |

---

## Quick Start (Docker) — Recommended

> Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/ledgerlink.git
cd ledgerlink
```

**2. Set up environment variables**
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
```

> Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey).  
> `SMTP_*` is only needed for forgot-password emails — the app works without it.

**3. Run**
```bash
docker compose up --build
```

**4. Open**
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

That's it. The database is created automatically on first run. A platform admin account is seeded automatically.

---

## Local Development (without Docker)

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # fill in your keys

uvicorn main:app --reload --port 8000
```

API runs at http://localhost:8000  
Interactive docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

---

## Test Credentials

After running the app, these accounts are ready to use:

| Role | Email | Password |
|---|---|---|
| Platform Admin | admin@ledgerlink.com | admin123 |

Use the Platform Admin to create an accounting firm, which generates a Firm Admin account. The Firm Admin can then add companies and accountants.

---

## Project Structure

```
ledgerlink/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── auth.py              # JWT authentication & RBAC guards
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models/models.py     # Database models (User, Firm, Company, Transaction…)
│   ├── routers/             # API route handlers
│   │   ├── auth_router.py
│   │   ├── firms_router.py
│   │   ├── companies_router.py
│   │   ├── users_router.py
│   │   ├── transactions_router.py
│   │   ├── review_router.py
│   │   ├── reports_router.py
│   │   ├── payment_heads_router.py
│   │   ├── stats_router.py
│   │   └── forgot_password_router.py
│   ├── services/
│   │   ├── ai_service.py    # Gemini AI document extraction
│   │   └── email_service.py # SMTP email (forgot password)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── platform/    # Platform admin views
│   │   │   ├── firm/        # Firm admin views
│   │   │   ├── accountant/  # Accountant views
│   │   │   └── company/     # Company views
│   │   ├── components/      # Layout, ProfileModal, ChangePasswordModal
│   │   ├── context/         # AuthContext, ToastContext
│   │   └── api/client.js    # Axios instance
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── start-backend.bat / start-frontend.bat   # Windows quick-start scripts
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router v6 |
| Backend | FastAPI, SQLAlchemy, SQLite, Python 3.11 |
| AI | Google Gemini 2.5 Flash (document extraction) |
| Auth | JWT (HS256), bcrypt password hashing |
| Deployment | Docker, nginx (SPA routing) |

---

## Features

- **AI document extraction** — Gemini reads invoices and fills vendor, amount, tax, date automatically
- **Review workflow** — Submitted → Under Review → Accepted / Rejected with audit trail
- **Role-based dashboards** — Animated charts, spend trends, status breakdowns per role
- **Report publishing** — Accountants upload MIS / P&L / Balance Sheet reports; companies download them
- **RBAC enforcement** — JWT auth with per-role route guards; deactivated firms/companies are locked out instantly
- **Profile management** — Profile photo upload, change password
- **Case-insensitive login** — Email comparison is case-insensitive at DB level
- **Toast notifications** — Real-time feedback on every action
- **Docker-ready** — Single `docker compose up` runs the full stack

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key for document extraction |
| `SMTP_EMAIL` | No | Gmail address for forgot-password emails |
| `SMTP_PASSWORD` | No | Gmail App Password (not your account password) |

---

## Database

LedgerLink uses SQLite — no database server required. The file is created at `backend/ledgerlink.db` on first run.

**In Docker:** the database is persisted via a bind mount (`./backend/ledgerlink.db`), so data survives container restarts.

**To inspect the database:**
```bash
# Install DB Browser for SQLite (GUI) — https://sqlitebrowser.org
# Or use the CLI:
sqlite3 backend/ledgerlink.db ".tables"
```

---

## Windows Quick Start (without Docker)

Double-click the batch files in the project root:

1. `start-backend.bat` — activates venv and starts the FastAPI server
2. `start-frontend.bat` — installs deps and starts the Vite dev server

---

## Team

**QA-Pilot**
