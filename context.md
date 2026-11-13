# TrustHire — Project Context & Developer Handover Guide

> **Document Purpose**: This file provides complete onboarding context for anyone continuing development on TrustHire. It covers what has been built, the architecture, technical decisions, file structure, demo data, test verification, and immediate next steps.

---

## 1. Project Overview & Objective

**TrustHire** is an AI-assisted candidate fraud detection and verification platform built for hackathon demonstration. It addresses candidate deception across three distinct vectors:
1. **Credential Verification**: Automated cross-checking of resume claims against LinkedIn tenure, certificate PDF metadata creation timestamps, and GitHub activity age/commit volumes.
2. **Identity Verification**: Multi-source legal name matching and zero-knowledge simulated government registry validation (PAN, Passport).
3. **Interview Integrity Monitoring**: Client-side proctoring telemetry tracking tab switches, window blur events, and correlated clipboard paste activity.
4. **Deterministic Trust Scoring**: A rule-based, explainable 0–100 score (Credentials 40%, Identity 35%, Interview 25%) paired with **Gemma 4 AI** for plain-English recruiter summaries and risk analysis.
5. **Dual-Portal Card Authentication System**: Role-segregated entry points for Candidates and HR/Recruiters, backed by anti-bot visual CAPTCHAs, 6-digit OTP verification, password reset workflows, and reactive hot toast telemetry.

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Key Architectural Decision |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React | Single-page and dashboard components built in `.jsx` for rapid iteration. Uses Tailwind CSS compiled into `app/tailwind.css`. Global `<Toaster />` mounted in root `layout.js` for reactive event notifications. |
| **Authentication & Security** | Canvas API, SpeechSynthesis, Pub/Sub Toast Event Bus | Client-side dual authentication suite (Candidate & HR). Implements canvas distortion security CAPTCHAs with audio synthesis for candidates, 6-digit auto-advancing OTP boxes with resend countdowns, and 3-step password recovery. |
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
│   │   │   └── ai_review.py              # AIQuestion, AIResponse, AIHistory
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
│   │   ├── layout.js                     # Root layout importing tailwind.css & mounting <Toaster />
│   │   ├── page.js                       # Public landing page (Hero, Features, HowItWorks, AI)
│   │   ├── globals.css                   # Custom theme variables
│   │   ├── tailwind.css                  # Compiled Tailwind utility classes
│   │   ├── login/                        # Dual Portal Auth Gateway
│   │   │   ├── page.jsx                  # Access portal selector (Candidate vs HR)
│   │   │   ├── candidate/page.jsx        # Candidate Sign In / Sign Up, Captcha, OTP & Reset
│   │   │   └── hr/page.jsx               # HR Recruiter Sign In / Sign Up, 2FA OTP & Reset
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
│   │   │   ├── OtpVerification.jsx       # 6-digit individual box inputs with countdown
│   │   │   └── ForgotPasswordFlow.jsx    # 3-step recovery flow (Email -> OTP -> New Password)
│   │   ├── ui/                           # Primitives: Button, Card, Badge, Modal, Input, etc.
│   │   │   └── Toast.jsx                 # Hot toast notification system & <Toaster />
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

## 4. Authentication Architecture & Security Details

TrustHire enforces strict role separation from entry through card-based UI workflows:

1. **Dual Portal Selector (`/login`)**:
   - Gateway card allowing users to route directly into Candidate or Recruiter workspaces.

2. **Candidate Portal Auth (`/login/candidate`, `/signup/candidate`)**:
   - **Color Theme**: Emerald (`#059669` / `bg-emerald-600`).
   - **Anti-Bot Security Challenge (`<Captcha />`)**: Mandatory HTML5 Canvas distorted alphanumeric verification with noise dots, bezier line interference, rotation, and Web Speech API audio synthesis readout.
   - **Demo Pre-fill**: Quick button to populate Sarah Chen (`cand-sarah-001`, Score: 87.0).
   - **Verification**: Dispatches 6-digit OTP to registered candidate email before granting access to `/candidate`.

3. **HR Recruiter Auth (`/login/hr`, `/signup/hr`)**:
   - **Color Theme**: Indigo / Slate (`#4f46e5` / `bg-indigo-600`).
   - **Workspace Registration**: Corporate email validation, organization name, and talent role.
   - **Enterprise Security**: Built-in Two-Factor Authentication (OTP) toggle + simulated Enterprise SSO (Google Workspace, Azure AD).
   - **Demo Account**: Pre-fills `recruiter@trusthire.ai` for instant access to candidate dossiers and Gemma 4 AI tools.

4. **6-Digit One-Time Password (`<OtpVerification />`)**:
   - Individual input boxes with auto-advance, backspace navigation, and clipboard paste listener.
   - 45-second resend countdown timer with instant toast feedback.
   - Acceptance for both expected demo codes and manual bypass values.

5. **Forgot Password Flow (`<ForgotPasswordFlow />`)**:
   - Integrated directly within the card UI:
     - Step 1: Input registered email address.
     - Step 2: Validate 6-digit OTP dispatched to email.
     - Step 3: Enter and confirm new password (minimum 8 characters) with show/hide password toggles.

6. **Hot Toast Notification System (`<Toast />`, `<Toaster />`)**:
   - Pub/sub architecture mounted in `app/layout.js`.
   - Fires toasts for every user interaction: tab switching, captcha refresh/readout, captcha validation error, OTP delivery, resend triggers, clipboard paste, login success, SSO launch, and demo pre-fill.

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

- **Frontend Compilation**: Verified with `next build` (Next.js 16.4.6 with Turbopack). All **21 routes** compile statically/dynamically with **0 errors**:
  - `/`
  - `/login`
  - `/login/candidate`
  - `/login/hr`
  - `/signup/candidate`
  - `/signup/hr`
  - `/candidate` (plus `/apply`, `/interview`, `/status`)
  - `/dashboard` (plus `/candidates`, `/candidates/[id]`, `/candidates/[id]/interview`, `/credentials`, `/identity`, `/interviews`, `/reports`, `/settings`)
- **Backend Test Suite**: Tested with `python run_full_verification.py`. All 11 test assertions passed (CRUD, calculations, AI fallbacks, interview telemetry, and document parsing).
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

### C. Removed Direct Cross-Portal Bridges & Public Profile Bypasses
- Removed the public "View Marcus Rivera Dossier" button on the landing page (`frontend/app/page.js`), enforcing that all candidate dossiers and trust records remain gated behind the authenticated HR portal.
- Removed the "Switch to HR Portal →" link from the Candidate Portal navigation header (`frontend/app/candidate/layout.jsx`), maintaining strict role segregation so candidate environments cannot directly bridge into administrative HR routes.

### D. Tailwind CSS v4 & Next.js 16 Turbopack Fix
- Compiled `@tailwindcss/cli` output into `frontend/app/tailwind.css` and linked it directly in `frontend/app/layout.js`, ensuring all utility classes, colors, gradients, and responsive layouts render properly without Turbopack subprocess conflicts.

### E. Firebase Integration & Persistence
- **Implemented Firestore Backend**: Fully integrated `firebase-admin` into the backend. 
- **Dynamic Database Switching**: Introduced `DatabaseManager` in `backend/app/db/manager.py`. When `DEMO_MODE=False` is set in `.env`, the system automatically routes all CRUD operations to live Firestore collections instead of in-memory dictionaries.
- **Seeding Support**: The `seed_demo_data()` function now supports pushing demo candidates directly to Firebase on the first run of a new environment.

### F. Candidates Directory Revamp & Sidebar Streamlining
- **Sidebar Streamlining**: Removed the standalone "Credentials" (`/dashboard/credentials`) and "Identity" (`/dashboard/identity`) items from the HR sidebar navigation in `frontend/app/dashboard/layout.jsx`. The HR sidebar now cleanly presents: Overview, Candidates, Interviews, Reports, and Settings.
- **Interactive Candidate Cards with Hover Scale**:
  - Revamped `frontend/components/candidate/CandidateCard.jsx` so each candidate card is entirely clickable with keyboard accessibility (`Enter`/`Space`).
  - Added subtle hover scaling and elevated shadows (`transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-indigo-300 cursor-pointer`).
  - Clicking the card directly opens the complete candidate dossier (`/dashboard/candidates/[id]`) with the circular Trust Score gauge, full findings breakdowns, and Gemma 4 AI chat assistant.
- **Dedicated Credentials & Identity Detail Modals**:
  - Integrated dedicated "Credentials" and "Identity" buttons on each candidate card with check counters and real-time status badges.
  - Buttons are structured in a full-width vertical stack within each card to prevent horizontal badge overflow, text wrapping collisions, and clipping.
  - Clicking either button utilizes `e.stopPropagation()` to prevent card navigation and opens an in-depth modal (`frontend/components/ui/Modal.jsx`) detailing all forensic checks:
    - Overall vector status banner.
    - Check title, check type (`employment_dates`, `cert_metadata`, `github_analysis`, `name_consistency`, `document_info`, etc.), status, and severity tag (`critical`, `high`, `medium`, `low`).
    - Forensic explanations and bulleted cited evidence lists.
    - Action button linking to the full candidate profile and trust score.
- **Candidates Directory Defaults & In-Row Button Placement**:
  - Set `viewMode` default to `'table'` (List View) so recruiters land on the clean tabular overview.
  - Positioned the small interactive `{ Credentials, Identity }` buttons directly under each candidate's name and email horizontally inside the `Candidate` column:
    - Candidate Cell: Avatar + Name + Email + horizontal `[ 📄 Credentials (badge) ] [ 🆔 Identity (badge) ]`.
    - Removed the standalone `Verifications` column to keep the table compact, preventing horizontal scrolling and right-edge clipping.
    - Clicking either small button opens the respective verification detail modal with `e.stopPropagation()`.
    - Clicking anywhere else on the row navigates seamlessly to the full candidate dossier (`/dashboard/candidates/[id]`).
  - Recruiters can still toggle freely between List View and Grid View (Cards).

### G. Animated Verification Interstitials for Document Submissions
- Built `<VerificationAnimationModal />` (`frontend/components/candidate/VerificationAnimationModal.jsx`) featuring animated bouncing vector icons, a gradient progress bar, and sequential "Checking..." to "Completed" status transitions (using "Checking..." while actively scanning and "Completed" upon completion).
- **Resume & Digital Footprint Verification (Step 2)**:
  - Triggers when the candidate completes Step 2 and clicks "Verify & Continue".
  - Runs animated forensic checks across:
    1. **Metadata**: Resume PDF creation date, author tags & revision history.
    2. **Links**: Profile URLs reachability, domain DNS & HTTPS SSL validity.
    3. **LinkedIn**: Career tenure timeline & role progression vs. resume.
    4. **GitHub**: Repository creation dates, commit volume & account age.
- **Comprehensive Multi-Vector Verification (Step 3)**:
  - Triggers upon submitting certificates and government ID proofs.
  - Concurrently audits all 6 vectors alongside the backend document upload pipeline:
    1. **Certificates**: Professional certificate issuer signatures & issue dates.
    2. **Personal Identifiers**: Government ID legal name match & document authenticity.
    3. **Metadata**: Image EXIF, PDF byte streams & hex signatures.
    4. **LinkedIn**: Career timeline cross-referencing.
    5. **GitHub**: Codebase integrity & language alignment.
    6. **Links**: Multi-vector deterministic trust score synthesis.
  - Smoothly finishes onto Step 4 (Submission Confirmation) featuring a 6/6 checks completed summary card.

---

## 9. Immediate Next Steps / Roadmap for Contributors

If you are picking up work on this project, consider these high-leverage enhancements:
1. **Real Gemma 4 Connection**: Configure `GEMMA_API_KEY` and `GEMMA_API_BASE_URL` in `backend/.env` to connect to a live Ollama or Vertex AI instance instead of demo mock responses.
2. **Real WebRTC / Camera Feed**: Enhance `frontend/app/dashboard/candidates/[id]/interview/page.jsx` with real face-mesh or face-api.js detection for multi-face detection.
3. **Configure Firebase**: While implemented, a live project requires setting `FIREBASE_CREDENTIALS_PATH` and `FIREBASE_PROJECT_ID` in `backend/.env` to activate persistence.
4. **PDF Report Export**: Wire up client-side PDF export (e.g., using `jspdf` or `html2canvas`) on `/dashboard/reports` and candidate profiles.
