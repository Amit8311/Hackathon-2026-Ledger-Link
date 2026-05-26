# LedgerLink — Claude Code Guide

## What this project is
LedgerLink is a multi-tenant financial document exchange platform for accounting firms. Firms manage client companies, companies upload invoices, and accountants review them with AI-extracted data. Built for a hackathon, fully production-deployable via Docker.

## Stack
- **Frontend:** React 18 + Vite, Tailwind CSS, Recharts, React Router v6, Axios
- **Backend:** FastAPI (Python), SQLAlchemy, SQLite, JWT + bcrypt, Google Gemini 2.5 Flash (AI)
- **Infra:** Docker Compose, Nginx (reverse proxy + SPA routing)

## How to run locally (no Docker)

### Backend
```bash
cd backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev                    # runs on http://localhost:5173
```

> **Windows shortcut:** double-click `start-backend.bat` and `start-frontend.bat` in the project root.

### Docker (recommended)
```bash
docker compose up --build
# Frontend: http://localhost:3000   Backend: http://localhost:8000
```

## Default credentials
| Email | Password | Role |
|-------|----------|------|
| admin@ledgerlink.com | admin123 | Platform Admin |

Run `cd backend && python seed.py` to populate demo firms, companies, users, and transactions.

## Project structure
```
finbridge/
├── backend/
│   ├── main.py                  # App entry point, router registration, admin seeding
│   ├── auth.py                  # JWT, bcrypt, role guards (require_firm_admin, etc.)
│   ├── database.py              # SQLite connection (ledgerlink.db)
│   ├── models/models.py         # All ORM models
│   ├── routers/                 # One file per feature area
│   │   ├── auth_router.py
│   │   ├── firms_router.py
│   │   ├── companies_router.py
│   │   ├── users_router.py
│   │   ├── transactions_router.py   # Upload + AI extraction
│   │   ├── review_router.py         # Accountant accept/reject workflow
│   │   ├── reports_router.py
│   │   ├── payment_heads_router.py
│   │   ├── notifications_router.py
│   │   ├── audit_router.py
│   │   ├── stats_router.py
│   │   └── forgot_password_router.py
│   └── services/
│       ├── ai_service.py        # Gemini document parsing (invoice/PDF → JSON)
│       └── email_service.py     # SMTP for password reset
│
├── frontend/src/
│   ├── api/client.js            # Axios instance — baseURL from VITE_API_URL or ''
│   ├── context/AuthContext.jsx  # JWT + user state, login/logout
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── platform/            # Platform admin views
│   │   ├── firm/                # Firm admin views
│   │   ├── company/             # Company user views
│   │   └── accountant/          # Accountant views
│   └── components/              # Layout, ProfileModal, NotificationBell, etc.
│
├── docker-compose.yml
├── frontend/vite.config.js      # Dev proxy: /api and /uploads → http://127.0.0.1:8000
└── frontend/nginx.conf          # Prod proxy: same routing via nginx
```

## User roles
| Role | Access |
|------|--------|
| `platform_admin` | Manage all accounting firms |
| `firm_admin` | Manage companies and users within their firm |
| `accountant` | Review and process transactions |
| `company_admin` | Upload invoices, view reports |
| `company_user` | Upload invoices, view reports |

## Key environment variables (`backend/.env`)
```
GEMINI_API_KEY=...        # Required for AI document extraction
SMTP_HOST=...             # Optional — for forgot-password emails
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
FROM_EMAIL=...
```

## PWA (Progressive Web App) — Mobile Support
The frontend is a fully installable PWA configured via `vite-plugin-pwa` in `vite.config.js`.

**Features:**
- Installable on Android and iOS ("Add to Home Screen")
- Offline-capable via Workbox service worker (`registerType: 'autoUpdate'`)
- API responses cached with `NetworkFirst` strategy (5 min TTL, 50 entry limit)
- App icons: `frontend/public/pwa-192.png` and `frontend/public/pwa-512.png`
- Portrait orientation locked, standalone display (no browser chrome)

**Manifest settings** (defined inline in `vite.config.js`):
```
name: LedgerLink
theme_color: #4F46E5
background_color: #E8EDF5
display: standalone
start_url: /
```

**Mobile access via Docker:**
The Docker setup (nginx on port 3000) is required for mobile devices — Vite dev server binds to localhost only. Access from a phone via the host machine's local IP:
```
http://<your-machine-ip>:3000
```

**Service worker gotcha:** In local dev (`npm run dev`), the service worker is **not active** — VitePWA only registers it in production builds. If you see stale cached responses after switching between Docker and dev, go to:
`DevTools → Application → Service Workers → Unregister`, then clear site data.

## Common gotchas
- **Vite proxy must use `127.0.0.1` not `localhost`** — on Windows, `localhost` resolves to IPv6 (`::1`) but the backend listens on IPv4 only, causing proxy timeouts.
- **Database is auto-created** on first run; platform admin is seeded automatically.
- **`profile_photo` column** is auto-migrated via `ALTER TABLE` in `main.py` for existing DBs.
- **CORS** is set to `allow_origins=["*"]` with `allow_credentials=False` — fine for dev/hackathon, lock down for production.
- The JWT secret in `auth.py` is hardcoded — replace before any real deployment.
