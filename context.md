# TrustHire — Project Context & Developer Handover Guide

> **Document Purpose**: This file provides complete onboarding context for anyone continuing development on TrustHire. It covers what has been built, the architecture, technical decisions, file structure, demo data, test verification, and immediate next steps.

---

## 1. Project Overview & Objective

**TrustHire** is an AI-assisted candidate fraud detection and verification platform built for hackathon demonstration. It addresses candidate deception across three distinct vectors:
1. **Credential Verification**: Automated cross-checking of resume claims against LinkedIn tenure, certificate PDF metadata creation timestamps, and GitHub activity age/commit volumes.
2. **Identity Verification**: Multi-source legal name matching and zero-knowledge simulated government registry validation (PAN, Passport).
3. **Interview Integrity Monitoring**: Client-side proctoring telemetry tracking tab switches, window blur events, and correlated clipboard paste activity.
4. **Deterministic Trust Scoring**: A rule-based, explainable 0–100 score (Credentials 40%, Identity 35%, Interview 25%) paired with **Gemma 4 AI** for plain-English recruiter summaries and risk analysis.
5. **Dual-Portal Authentication System**: Role-segregated Candidate and HR/Recruiter entry points, candidate anti-bot CAPTCHA, Firebase email-link sign-in, password recovery UI, and reactive toast notifications. The Firebase migration is currently incomplete; see Section 4.

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Key Architectural Decision |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React | Single-page and dashboard components built in `.jsx` for rapid iteration. Uses Tailwind CSS compiled into `app/tailwind.css`. Global `<Toaster />` mounted in root `layout.js` for reactive event notifications. |
| **Authentication & Security** | Firebase Authentication email-link sign-in, Canvas API, SpeechSynthesis, Pub/Sub Toast Event Bus | Firebase email-link sign-in is the intended flow. The client callback exists, but the backend ID-token/profile handoff still needs integration; see Section 4. |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, httpx, firebase-admin | Modular REST API with route segregation. Uses a dynamic `DatabaseManager` to switch between an in-memory `MockDB` (for demo/local development) and `FirebaseDB` (for production persistence) based on `DEMO_MODE` environment toggle. |
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
│   │   │   ├── ai_review.py              # AIQuestion, AIResponse, AIHistory
│   │   │   └── user.py                   # User/profile schemas
│   │   ├── db/
│   │   │   ├── manager.py                # Database factory (switches between Mock and Firebase)
│   │   │   ├── mock_db.py                # Thread-safe in-memory store
│   │   │   └── firebase.py               # Firestore implementation with Admin SDK
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
│   │       ├── auth.py                   # Firebase ID-token verification (integration pending)
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
│   │   ├── auth/email-link/page.jsx      # Firebase email-link completion callback
│   │   ├── layout.js                     # Root layout importing tailwind.css & mounting <Toaster />
│   │   ├── page.js                       # Public landing page (Hero, Features, HowItWorks, AI)
│   │   ├── globals.css                   # Custom theme variables
│   │   ├── tailwind.css                  # Compiled Tailwind utility classes
│   │   ├── login/                        # Dual Portal Auth Gateway
│   │   │   ├── page.jsx                  # Access portal selector (Candidate vs HR)
│   │   │   ├── candidate/page.jsx        # Candidate Sign In / Sign Up, Captcha, email link & reset
│   │   │   └── hr/page.jsx               # HR Sign In / Sign Up, email link & reset
│   │   ├── signup/                       # Direct Registration Entry Points
│   │   │   ├── candidate/page.jsx        # Dedicated candidate signup wrapper
│   │   │   └── hr/page.jsx               # Dedicated HR team registration wrapper
│   │   ├── candidate/                    # SECTION 1: CANDIDATE ONLY PORTAL
│   │   │   ├── layout.jsx                # Candidate portal header & navigation
│   │   │   ├── page.jsx                  # Candidate portal home & action cards
│   │   │   ├── apply/page.jsx            # Candidate document & profile submission wizard
│   │   │   ├── interview/page.jsx        # Live proctored assessment room (camera & questions)
│   │   │   └── status/page.jsx           # Application verification progress tracker
│   │   └── dashboard/                    # SECTION 2: HR ONLY PORTAL
│   │       ├── layout.jsx                # Recruiter navigation shell with sidebar
│   │       ├── page.jsx                  # Operations Hub overview & statistics
│   │       ├── candidates/
│   │       │   ├── page.jsx              # Candidate list (Search, Filter, Table/Grid)
│   │       │   └── [id]/
│   │       │       ├── page.jsx          # Candidate profile (Gauge, Tabs, Gemma AI Chat)
│   │       │       └── interview/page.jsx# Live proctoring monitor & event logger
│   │       ├── credentials/page.jsx      # Credential audits list
│   │       ├── identity/page.jsx         # Identity audits list
│   │       ├── interviews/page.jsx       # Interview sessions list
│   │       ├── reports/page.jsx          # Cohort risk distribution analytics
│   │       └── settings/page.jsx         # Demo mode & Gemma model settings
│   ├── components/
│   │   ├── auth/                         # Authentication & Security Components
│   │   │   ├── Captcha.jsx               # Canvas anti-bot challenge with audio readout
│   │   │   ├── EmailLinkNotice.jsx       # Inbox instructions and resend link action
│   │   │   ├── OtpVerification.jsx       # Legacy demo OTP used by recovery UI
│   │   │   └── ForgotPasswordFlow.jsx    # Demo recovery flow (Email -> demo OTP -> New Password)
│   │   ├── ui/                           # Primitives: Button, Card, Badge, Modal, Input, etc.
│   │   │   └── Toast.jsx                 # Hot toast notification system & <Toaster />
│   │   ├── candidate/                    # TrustGauge, FindingCard, AIChat, CandidateCard
│   │   ├── dashboard/                    # StatCard, ActivityFeed, TrustDistribution
│   │   └── landing/                      # Navbar, Hero, Features, HowItWorks, Footer
│   ├── lib/
│   │   ├── api.js                        # Unified fetch client with offline fallbacks
│   │   ├── firebase.js                   # Firebase client and email-link helpers
│   │   ├── constants.js                  # Demo data, thresholds, and questions
│   │   └── utils.js                      # Formatting, score colors, Tailwind merge
│   ├── .env.firebase.example              # Firebase web config template (copy to .env.local)
│   └── package.json                      # Dependencies and build scripts (Firebase SDK included)
│
├── .env.example                          # Root environment template
├── .gitignore                            # Standard Node, Python, Next.js ignores
├── README.md                             # Project overview and run instructions
└── context.md                            # THIS FILE — Onboarding and technical context
```

---

## 4. Authentication Architecture & Security Details

The intended login/signup design uses Firebase email-link sign-in for both roles. The current files are only partially migrated and must be reconciled before auth can work:

1. **Candidate and HR login pages** (`frontend/app/login/candidate/page.jsx`, `frontend/app/login/hr/page.jsx`) still call `api.auth.login()` and `api.auth.signup()` before sending the Firebase link.
2. **API client** (`frontend/lib/api.js`) currently exposes only `api.auth.verifyToken()`. The signup/login methods those pages call no longer exist, so login and signup fail before a link is sent.
3. **Email-link callback** (`frontend/app/auth/email-link/page.jsx`) completes Firebase client sign-in and stores a session, but does not call `api.auth.verifyToken()` with the Firebase ID token. The backend therefore does not receive verified user/profile data.
4. **Backend token endpoint** (`backend/app/routers/auth.py`) declares `token` and `role` as plain function parameters. FastAPI treats these as query parameters, while the frontend API helper sends JSON. Use a Pydantic request model and send the token in a body; return a clear error when Firebase Admin cannot verify it.
5. **Firebase Admin startup** (`backend/app/main.py`) calls `firebase_admin.initialize_app()` even when the credential path is missing. This relies on Application Default Credentials and can fail locally; it may also conflict with initialization inside `backend/app/db/firebase.py`. Initialize Firebase Admin once and share the app instance.
6. **Firebase client setup** is in `frontend/lib/firebase.js`. Copy `frontend/.env.firebase.example` to `frontend/.env.local` and fill in the Firebase web app values. In Firebase Console enable Email/Password and Email link sign-in, and authorize `localhost` plus the deployed app domain.
7. Login/signup use click-through links rather than numeric OTPs. `OtpVerification.jsx` remains only in the demo forgot-password UI, which is still a local mock and is not backed by Firebase.
8. The pre-filled demo login buttons were removed because their placeholder email addresses cannot receive Firebase links. Use an inbox you can access.

The backend profile endpoint is intended to verify Firebase ID tokens before creating or retrieving role-specific profiles. Do not treat the current `sessionStorage` value alone as proof of backend authentication.

The toast bus remains mounted in `frontend/app/layout.js` and reports auth errors, email-link send status, and form feedback.

---

## 5. Demo Candidates & Scenario Data

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

## 6. How to Run the Project Locally

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
- Dual Portal Selector: `http://localhost:3000/login`
- Candidate Login & Sign Up: `http://localhost:3000/login/candidate`
- HR Recruiter Login & Sign Up: `http://localhost:3000/login/hr`
- Recruiter Dashboard: `http://localhost:3000/dashboard`
- Candidate Profile: `http://localhost:3000/dashboard/candidates/cand-marcus-002`
- Live Interview Monitor: `http://localhost:3000/dashboard/candidates/cand-marcus-002/interview`

---

## 7. Testing & Verification Status

- **Historical baseline (before the current Firebase Auth refactor)**: `next build` was previously reported to compile all 21 routes, and `python run_full_verification.py` passed all 11 backend module checks. These checks have not been rerun against the current partial auth migration.
- **Current auth work**: Firebase SDK package resolution succeeded and `git diff --check` passed. A full frontend build and end-to-end Firebase link/token verification have not been run.
- **Known lint baseline**: The earlier full ESLint run reported 31 errors and 7 warnings across interview, dashboard, and UI files. Targeted auth lint had passed before the latest Firebase ID-token migration; rerun after reconciling the API calls below.
- **Frontend Compilation**: Earlier `next build` was recorded to compile all **21 routes**:
  - `/`
  - `/login`
  - `/login/candidate`
  - `/login/hr`
  - `/signup/candidate`
  - `/signup/hr`
  - `/candidate` (plus `/apply`, `/interview`, `/status`)
  - `/dashboard` (plus `/candidates`, `/candidates/[id]`, `/candidates/[id]/interview`, `/credentials`, `/identity`, `/interviews`, `/reports`, `/settings`)
- **Backend Test Suite**: Earlier run of `python run_full_verification.py` passed all 11 assertions (CRUD, calculations, AI fallbacks, interview telemetry, and document parsing).
- **CSS Styling**: Built with Tailwind CSS v4 into `frontend/app/tailwind.css` and imported by `layout.js`.

---

## 8. Recent Architectural Changes & Updates (Changelog)

### A. Candidate-Driven Onboarding Enforcement
- **HR Cannot Add Candidates**: Per the hiring integrity problem statement, HR recruiters must not manually create candidate profiles. Candidates must self-register, submit their resume/documents, and complete their verification dossier through the **Candidate Portal** (`/candidate/apply`).
- **Removed HR Buttons & Routes**:
  - Removed `+ New Candidate` button from the HR sidebar in `frontend/app/dashboard/layout.jsx`.
  - Removed `+ Add Candidate` button from the Operations Hub in `frontend/app/dashboard/page.jsx`.
  - Removed `+ Add Candidate` button from the Candidates Directory in `frontend/app/dashboard/candidates/page.jsx`.
  - Deleted the obsolete manual creation route directory `frontend/app/dashboard/candidates/new/`.

### B. Cleaned HR Top Navigation
- Removed the redundant `Public Site` button and divider from the HR top bar in `frontend/app/dashboard/layout.jsx`. Clicking the TrustHire logo in the upper-left of the sidebar navigates directly to the Home page (`/`).

### C. Removed Direct Public Profile Bypass ("View Marcus Rivera Dossier")
- Removed the public "View Marcus Rivera Dossier" button on the landing page (`frontend/app/page.js`), enforcing that all candidate dossiers and trust records remain gated behind the authenticated HR portal.

### D. Tailwind CSS v4 & Next.js 16 Turbopack Fix
- Compiled `@tailwindcss/cli` output into `frontend/app/tailwind.css` and linked it directly in `frontend/app/layout.js`, ensuring all utility classes, colors, gradients, and responsive layouts render properly without Turbopack subprocess conflicts.

### E. Firebase Integration & Persistence
- **Implemented Firestore Backend**: Fully integrated `firebase-admin` into the backend. 
- **Dynamic Database Switching**: Introduced `DatabaseManager` in `backend/app/db/manager.py`. When `DEMO_MODE=False` is set in `.env`, the system automatically routes all CRUD operations to live Firestore collections instead of in-memory dictionaries.
- **Seeding Support**: The `seed_demo_data()` function now supports pushing demo candidates directly to Firebase on the first run of a new environment.

### F. Firebase Email-Link Authentication (in progress)
- The requested sign-in experience is a Firebase email sign-in link. Login/signup pages show an inbox notice and resend action; numeric codes are no longer used for those flows.
- Added the Firebase Web SDK (`firebase` dependency) to `frontend/package.json`, `package-lock.json`, and `pnpm-lock.yaml`.
- Added `frontend/lib/firebase.js`, `frontend/components/auth/EmailLinkNotice.jsx`, and `frontend/app/auth/email-link/page.jsx`. The callback completes `signInWithEmailLink`, writes a role-specific session to `sessionStorage`, then redirects to the Candidate or HR area.
- Added `frontend/.env.firebase.example`. Copy it to `frontend/.env.local`, fill the Firebase web app config, enable Email/Password plus Email link sign-in in Firebase Console, and authorize `localhost` and the deployed domain.
- The current Firebase ID-token migration changed `backend/app/routers/auth.py`, `backend/app/models/user.py`, `backend/app/main.py`, and `frontend/lib/api.js` to remove password endpoints and add Firebase token verification. It is **not complete**: the login pages still call the removed `api.auth.login/signup`; the email-link callback does not send an ID token to the backend; and `/api/auth/verify-token` currently expects query parameters while the API helper sends a JSON body. `firebase_admin.initialize_app()` is also called without an explicit credential and may fail or conflict with Firestore initialization. Fix these mismatches before using auth.
- Backend Firebase Admin credentials/project setup is required to verify ID tokens. The Gmail App Password discussed earlier is not used by this Firebase flow; revoke it if it was a real credential.
- The standalone `ForgotPasswordFlow` remains a local demo flow using a fake OTP and does not currently use Firebase.

### H. UI Polish: Header Cleanliness & Horizontal Trust Score Bar
- **Removed "MVP" & "Acme Enterprise"**:
  - Removed the `"MVP"` badge next to the TrustHire logo in the dashboard sidebar (`frontend/app/dashboard/layout.jsx`).
  - Removed `"Acme Enterprise"` from the recruiter profile badge in the dashboard top navigation bar (`frontend/app/dashboard/layout.jsx`), keeping only the clean `"Lead Recruiter"` designation.
- **Added Horizontal Trust Score Indicator Bars**:
  - In the Candidates Directory table list view (`frontend/app/dashboard/candidates/page.jsx`), added a sleek horizontal progress bar under the trust score numbers (`87/100`, `42/100`, `64/100`), dynamically filled to the candidate's exact score and colored according to risk levels (green for high trust, red for critical review, amber for needs review).
  - Also added the matching horizontal score bar to candidate cards (`frontend/components/candidate/CandidateCard.jsx`) for visual consistency across view modes.

---

## 9. Immediate Next Steps / Roadmap for Contributors

If you are picking up work on this project, consider these high-leverage enhancements:
1. **Finish Firebase Auth integration**: Reconcile frontend signup/login calls with the ID-token endpoint, post the ID token from the email-link callback, parse it via a Pydantic body model, and initialize Firebase Admin once with valid credentials.
2. **Configure Firebase**: Fill `frontend/.env.local` from `frontend/.env.firebase.example`; enable Email/Password and Email link sign-in; authorize local and production domains; set backend `FIREBASE_CREDENTIALS_PATH` and `FIREBASE_PROJECT_ID` for token verification and Firestore persistence.
3. **Real Gemma 4 Connection**: Configure `GEMMA_API_KEY` and `GEMMA_API_BASE_URL` in `backend/.env` to connect to a live Ollama or Vertex AI instance instead of demo mock responses.
4. **Real WebRTC / Camera Feed**: Enhance `frontend/app/dashboard/candidates/[id]/interview/page.jsx` with real face-mesh or face-api.js detection for multi-face detection.
5. **PDF Report Export**: Wire up client-side PDF export (e.g., using `jspdf` or `html2canvas`) on `/dashboard/reports` and candidate profiles.
