# TrustHire — Project Context & Developer Handover Guide

> **Document Purpose**: This file provides complete onboarding context for anyone continuing development on TrustHire. It covers what has been built, the architecture, technical decisions, file structure, demo data, test verification, and immediate next steps.

---

## 1. Project Overview & Objective

**TrustHire** is an AI-assisted candidate fraud detection and verification platform built for hackathon demonstration. It addresses candidate deception across three distinct vectors:
1. **Credential Verification**: Automated cross-checking of resume claims against LinkedIn tenure, certificate PDF metadata creation timestamps, and GitHub activity age/commit volumes.
2. **Identity Verification**: Multi-source legal name matching and zero-knowledge simulated government registry validation (PAN, Passport).
3. **Interview Integrity Monitoring**: Client-side proctoring telemetry tracking tab switches, window blur events, and correlated clipboard paste activity.
4. **Deterministic Trust Scoring**: A rule-based, explainable 0–100 score (Credentials 40%, Identity 35%, Interview 25%) paired with **Gemma 4 AI** for plain-English recruiter summaries and risk analysis.

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Key Architectural Decision |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React | Single-page and dashboard components built in plain JavaScript (`.jsx`) for rapid iteration. Uses Tailwind CSS compiled via `@tailwindcss/cli` into `app/tailwind.css`. |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, httpx | Modular REST API with route segregation. In-memory dictionary database (`MockDB`) with automatic demo seeding on startup — no external DB or Firebase required to run. |
| **AI Layer** | Gemma 4 integration via `AIService` | Supports live Gemma endpoints with automatic fallback to realistic `[Demo Mode]` responses if no API key is provided. |
| **Documents** | PyPDF2, python-docx, Pillow | Extracts text and PDF metadata (`/Author`, `/CreationDate`) for forensic tamper checks. |

---

## 3. Repository Structure & File Map

```
c:\Doomsday-Parity\
├── backend/                              # FastAPI application
│   ├── app/
│   │   ├── main.py                       # FastAPI entry point, CORS, router inclusion
│   │   ├── config.py                     # Environment settings (DEMO_MODE, GEMMA keys)
│   │   ├── models/                       # Pydantic schemas
│   │   │   ├── candidate.py              # CandidateCreate, CandidateResponse
│   │   │   ├── document.py               # DocumentResponse, DocumentUpload
│   │   │   ├── verification.py           # VerificationResult schema
│   │   │   ├── interview.py              # InterviewEvent, InterviewSession, Report
│   │   │   └── ai_review.py              # AIQuestion, AIResponse, AIHistory
│   │   ├── db/
│   │   │   ├── mock_db.py                # Thread-safe in-memory store
│   │   │   └── firebase.py               # Firebase client stub with fallback
│   │   ├── demo/
│   │   │   └── seed.py                   # Pre-seeded test candidates (Sarah, Marcus, Priya)
│   │   ├── services/
│   │   │   ├── ai_service.py             # Gemma 4 LLM client with demo mock logic
│   │   │   ├── trust_service.py          # Rule-based 0-100 trust scoring algorithm
│   │   │   ├── credential_service.py     # Resume & cert metadata cross-referencing
│   │   │   ├── identity_service.py       # Name consistency & PAN verification
│   │   │   ├── interview_service.py      # Suspicious event aggregation & reporting
│   │   │   └── document_service.py       # PDF/DOCX text & metadata extractors
│   │   └── routers/                      # REST API endpoints
│   │       ├── candidates.py             # CRUD /api/candidates
│   │       ├── documents.py              # Upload /api/candidates/{id}/documents
│   │       ├── credentials.py            # /api/candidates/{id}/credentials
│   │       ├── identity.py               # /api/candidates/{id}/identity
│   │       ├── interviews.py             # /api/interviews (create, log events, report)
│   │       ├── trust.py                  # /api/candidates/{id}/trust/calculate
│   │       └── ai_assistant.py           # /api/candidates/{id}/ai/ask & history
│   ├── requirements.txt                  # Python dependencies
│   ├── run_full_verification.py          # Standalone 11-point backend test script
│   └── .env.example                      # Backend environment template
│
├── frontend/                             # Next.js 16 Web Application
│   ├── app/                              # Next.js App Router
│   │   ├── layout.js                     # Root layout importing tailwind.css
│   │   ├── page.js                       # Public landing page (Hero, Features, AI)
│   │   ├── globals.css                   # Custom theme variables
│   │   ├── tailwind.css                  # Compiled Tailwind utility classes
│   │   └── dashboard/
│   │       ├── layout.jsx                # Recruiter navigation shell with sidebar
│   │       ├── page.jsx                  # Operations Hub overview & statistics
│   │       ├── candidates/
│   │       │   ├── page.jsx              # Candidate list (Search, Filter, Table/Grid)
│   │       │   ├── new/page.jsx          # 4-Step Candidate submission wizard
│   │       │   └── [id]/
│   │       │       ├── page.jsx          # Candidate profile (Gauge, Tabs, Gemma AI Chat)
│   │       │       └── interview/page.jsx# Live proctoring monitor & event logger
│   │       ├── credentials/page.jsx      # Credential audits list
│   │       ├── identity/page.jsx         # Identity audits list
│   │       ├── interviews/page.jsx       # Interview sessions list
│   │       ├── reports/page.jsx          # Cohort risk distribution analytics
│   │       └── settings/page.jsx         # Demo mode & Gemma model settings
│   ├── components/
│   │   ├── ui/                           # Primitives: Button, Card, Badge, Modal, etc.
│   │   ├── candidate/                    # TrustGauge, FindingCard, AIChat, CandidateCard
│   │   ├── dashboard/                    # StatCard, ActivityFeed, TrustDistribution
│   │   └── landing/                      # Navbar, Hero, Features, HowItWorks, Footer
│   ├── lib/
│   │   ├── api.js                        # Unified fetch client with offline fallbacks
│   │   ├── constants.js                  # Demo data, thresholds, and questions
│   │   └── utils.js                      # Formatting, score colors, Tailwind merge
│   └── package.json                      # Dependencies and build scripts
│
├── .env.example                          # Root environment template
├── .gitignore                            # Standard Node, Python, Next.js ignores
├── README.md                             # Project overview and run instructions
└── context.md                            # THIS FILE — Onboarding and technical context
```

---

## 4. Demo Candidates & Scenario Data

The database comes pre-seeded on backend startup (`app/demo/seed.py`) with three distinct candidate profiles designed for hackathon judging:

1. **Sarah Chen** (`cand-sarah-001`) — **High Trust (Score: 87.0)**
   - Role: Senior Frontend Engineer
   - Verification: All employment dates match LinkedIn, AWS Certificate verified, GitHub profile active since 2019, 0 proctoring tab switches.
2. **Marcus Rivera** (`cand-marcus-002`) — **Critical Risk (Score: 42.0)**
   - Role: Full Stack Developer
   - Red Flags:
     - Resume claims 2020–2023 Senior Dev at TechCorp; LinkedIn shows Junior Dev 2021–2022. Overlaps with DataFlow Inc.
     - Google Cloud Certificate PDF creation date is March 2024 despite claimed Jan 2022 issue date (Author: "Template User").
     - GitHub created 2 months ago despite claiming 4+ years open-source contributions.
     - Live interview: 7 tab switches away and 4 clipboard paste bursts.
3. **Priya Sharma** (`cand-priya-003`) — **Needs Review (Score: 64.0)**
   - Role: Backend Engineer
   - Mixed Signals: Azure certificate verification URL returns 404 (expired link), 3 proctoring tab switches, identity checks clean.

---

## 5. How to Run the Project Locally

### Terminal 1: Backend (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- Candidates list: `http://localhost:8000/api/candidates`

### Terminal 2: Frontend (Next.js)
```bash
cd frontend
pnpm run dev
```
- App runs at: `http://localhost:3000`
- Landing page: `http://localhost:3000`
- Recruiter Dashboard: `http://localhost:3000/dashboard`
- Candidate Profile: `http://localhost:3000/dashboard/candidates/cand-marcus-002`
- Live Interview Monitor: `http://localhost:3000/dashboard/candidates/cand-marcus-002/interview`

---

## 6. Testing & Verification Status

- **Frontend Compilation**: Verified with `pnpm run build` using `@tailwindcss/cli`. All 12 routes compile statically/dynamically with 0 errors.
- **Backend Test Suite**: Tested with `python run_full_verification.py`. All 11 test assertions passed (CRUD, calculations, AI fallbacks, interview telemetry, and document parsing).
- **CSS Styling**: Generated in `frontend/app/tailwind.css` and imported by `layout.js`.

---

## 7. Immediate Next Steps / Roadmap for Contributors

If you are picking up work on this project, consider these high-leverage enhancements:
1. **Real Gemma 4 Connection**: Configure `GEMMA_API_KEY` and `GEMMA_API_BASE_URL` in `backend/.env` to connect to a live Ollama or Vertex AI instance instead of demo mock responses.
2. **Real WebRTC / Camera Feed**: Enhance `frontend/app/dashboard/candidates/[id]/interview/page.jsx` with real face-mesh or face-api.js detection for multi-face detection.
3. **Firebase Persistence**: Connect a real Firebase project by setting `FIREBASE_CREDENTIALS_PATH` in `backend/app/config.py` to persist uploaded candidate documents and audits across restarts.
4. **PDF Report Export**: Wire up client-side PDF export (e.g., using `jspdf` or `html2canvas`) on `/dashboard/reports` and candidate profiles.
