# TrustHire — Project Context & Developer Handover Guide

> **Document Purpose**: This file provides complete onboarding context for anyone continuing development on TrustHire. It covers what has been built, the architecture, technical decisions, file structure, demo data, test verification, and immediate next steps.

---

## 1. Project Overview & Objective

### Current persistence configuration (November 2026)

- **Current auth flow (latest change):** Candidate and HR signup, password login, and email-link sign-in use Next.js server routes backed by MongoDB. New signup writes an expiring challenge to `auth_otps`; after correct OTP verification only, the profile is inserted into `users`. Passwords are scrypt hashes. Gmail delivery uses Nodemailer. Click-to-sign-in tokens are hashed and stored in `auth_links` with expiry and one-use tracking. Firebase Auth and Firestore adapters have been removed from the running app and dependencies.
- Configure the frontend's ignored `frontend/.env.local` with `MONGODB_URI`, `MONGODB_DATABASE=trusthire`, a stable random `AUTH_OTP_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `NEXT_PUBLIC_APP_URL`. The current local sender address is configured there; no credentials belong in Git. `.env.example` documents the variable names without values.
- The client login pages are `frontend/app/login/candidate/page.jsx` and `frontend/app/login/hr/page.jsx`; shared request methods are in `frontend/lib/mongo-auth.js`; server-only hashing, Mongo, and Nodemailer helpers are in `frontend/lib/server/mongo-auth.js`; endpoint handlers are in `frontend/app/api/auth/`. The click-through page is `frontend/app/auth/email-link/page.jsx`.
- App session values remain tab-scoped in `sessionStorage`; these client-side role checks are navigation guards, not server-side authorization for the Python data APIs. Accounts from the retired Firebase project are not migrated; users must create a MongoDB account.
- Persistent application data uses MongoDB Atlas: set `DEMO_MODE=false`, `DATABASE_BACKEND=mongodb`, `MONGODB_URI` (kept private in ignored `backend/.env`), and `MONGODB_DATABASE=trusthire`. Mongo stores `users`, `candidates`, `documents`, `verifications`, `interviews`, and `ai_history`; GridFS stores original candidate uploads. MongoDB initialization creates these collections and indexes. Candidate applications associate with their Mongo user record via `user_id` and expose the linked `candidate_id` in the candidate session.
- With `DEMO_MODE=true`, the backend uses the in-memory mock database and built-in demo seed; with `DEMO_MODE=false`, MongoDB is the only persistent backend.
- Demo fixtures can be added idempotently to a configured Atlas database with `cd backend && python3 seed_mongodb_demo.py`. Existing records are not overwritten. Atlas connectivity was confirmed and the six app collections plus two GridFS collections were initialized in the `trusthire` database on November 14, 2026.
- `backend/app/db/mongodb.py` implements Mongo CRUD/GridFS; `backend/app/db/manager.py` selects the adapter; `backend/app/routers/documents.py` stores originals in GridFS for Mongo deployments.

**TrustHire** is an AI-assisted candidate fraud detection and verification platform built for hackathon demonstration. It addresses candidate deception across four distinct vectors:

1. **Credential Verification**: Automated cross-checking of resume claims against LinkedIn tenure, certificate PDF metadata creation timestamps, and GitHub activity age/commit volumes.
2. **Identity Verification**: Multi-source legal name matching and zero-knowledge simulated government registry validation (PAN, Passport).
3. **Voice-Enabled AI Interviewer & Candidate Integrity Monitoring**:
   - **Role Separation**: Dedicated Candidate Room (`/candidate/interview`) for reading questions and recording voice answers; dedicated HR Monitoring Center (`/dashboard/candidates/[id]/interview`) for question generation, real-time eye movement tracking, and AI-generated answer detection.
   - **Voice-First Candidate Interaction**: Microphone capture with automated local Whisper speech-to-text transcription.
   - **AI-Generated Answer Detection**: Spoken answers are analyzed for linguistic markers of LLM assistance (uniform sentence length, elevated perplexity, absence of natural filler words/pauses, producing a 0–100% AI Likelihood Score).
   - **Webcam & Eye Movement Gaze Tracking**: Real-time canvas/FaceDetector tracking detecting gaze orientation (looking at screen vs. eye deviation away), prolonged look-away counter, and dynamic attention percentage score.
   - **Resume Document Scanner & Question Generator**: Scans candidate documents/resumes (skills, projects, past experience) and leverages Ollama + Gemma 4 / LangChain templates to generate tailored technical challenge questions dispatched to the candidate in real time.
   - **Dual Video Feeds**: Both portals display professional video tiles (Candidate sees HR interviewer feed + self preview; HR sees candidate proctoring feed + HR broadcast tile with mute/video controls).
   - **Background Integrity Telemetry**: Detects tab switching (Page Visibility API), window blur events, unauthorized typing, and clipboard paste bursts.
4. **Deterministic Trust Scoring**: A rule-based, explainable 0–100 score (Credentials 40%, Identity 35%, Interview 25%) paired with **Gemma 4 AI** for plain-English recruiter summaries and risk analysis.
5. **Dual-Portal Authentication System**: Role-segregated Candidate and HR/Recruiter entry points, candidate anti-bot CAPTCHA, MongoDB password sign-in, email-link sign-in, OTP-verified signup, and reactive toast notifications.

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Key Architectural Decision |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React | Single-page and dashboard components built in `.jsx` for rapid iteration. Uses Tailwind CSS compiled into `app/tailwind.css`. Global `<Toaster />` mounted in root `layout.js` for reactive event notifications. |
| **Authentication & Security** | Canvas API, SpeechSynthesis, Pub/Sub Toast Event Bus | Client-side dual authentication suite (Candidate & HR). Implements canvas distortion security CAPTCHAs with audio synthesis for candidates, 6-digit auto-advancing OTP boxes with resend countdowns, and 3-step password recovery. |
| **Interview & Proctoring** | MediaRecorder API, HTML5 Canvas, FaceDetector API, WebRTC / WebM | Dedicated role-separated interview engine. Canvas-based eye gaze estimator with pupil/face centering heuristics and attention scoring. Dual-tile video architecture for candidate and interviewer feeds. |
| **Speech-to-Text & AI Detection** | Local Whisper, Ollama + Gemma 4, LangChain | Voice recording via MediaRecorder (WebM/Opus) transcribing into text. Spoken answers analyzed via AI response detector (0–100% LLM score based on vocabulary complexity, filler density, and syntactic uniformity). |
| **Authentication & Security** | MongoDB auth routes, Nodemailer OTP and email links, Canvas API, SpeechSynthesis, Pub/Sub Toast Event Bus | Signup OTP and email-link tokens are verified by Next.js server routes; app sessions remain tab-scoped. |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, PyMongo | Modular REST API with route segregation. `DatabaseManager` selects in-memory demo data or persistent MongoDB Atlas from environment settings. |
| **AI Layer** | Gemma 4 integration via `AIService` & LangChain context | Supports live Gemma endpoints with automatic fallback to realistic `[Demo Mode]` responses if no API key is provided. Pre-seeded candidate response models for Sarah (18% AI), Marcus (88% AI), and Priya (42% AI). |
| **Documents** | PyPDF2, python-docx, Pillow | Extracts text and PDF metadata (`/Author`, `/CreationDate`) for forensic tamper checks. |

---

## 3. Repository Structure & File Map

```
Doomsday-Parity/
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
│   │   │   ├── manager.py                # Database factory (Mock or MongoDB)
│   │   │   ├── mock_db.py                # Thread-safe in-memory store
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
│   │   ├── auth/email-link/page.jsx      # MongoDB one-time email-link callback
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
│   │   │   ├── interview/page.jsx        # Live voice assessment room (dual camera & voice recorder)
│   │   │   └── status/page.jsx           # Application verification progress tracker
│   │   └── dashboard/                    # SECTION 2: HR ONLY PORTAL
│   │       ├── layout.jsx                # Recruiter navigation shell with sidebar
│   │       ├── page.jsx                  # Operations Hub overview & statistics
│   │       ├── candidates/
│   │       │   ├── page.jsx              # Candidate list (Search, Filter, Table/Grid)
│   │       │   └── [id]/
│   │       │       ├── page.jsx          # Candidate profile (Gauge, Tabs, Gemma AI Chat)
│   │       │       └── interview/page.jsx# Live HR Interview Monitor & Proctoring Center
│   │       ├── credentials/page.jsx      # Credential audits list
│   │       ├── identity/page.jsx         # Identity audits list
│   │       ├── interviews/page.jsx       # Interview sessions list with "Launch Monitor"
│   │       ├── reports/page.jsx          # Cohort risk distribution analytics
│   │       └── settings/page.jsx         # Demo mode & Gemma model settings
│   │
│   ├── components/
│   │   ├── auth/                         # Authentication & Security Components
│   │   │   ├── Captcha.jsx               # Canvas anti-bot challenge with audio readout
│   │   │   ├── OtpVerification.jsx       # 6-digit individual box inputs with countdown
│   │   │   └── ForgotPasswordFlow.jsx    # 3-step recovery flow (Email -> OTP -> New Password)
│   │   ├── interview/                    # Specialized Interview & Proctoring Components
│   │   │   ├── CameraMonitorPanel.jsx    # Candidate video feed with real-time eye gaze tracking
│   │   │   ├── HRCameraTile.jsx          # Reusable HR interviewer camera video tile with controls
│   │   │   ├── CandidateAnswerReview.jsx # Live Whisper speech transcript & AI response detector
│   │   │   ├── ResumeQuestionGenerator.jsx # Scans resume skills/projects to generate AI questions
│   │   │   ├── AIQuestionCard.jsx        # Active question display with TTS audio read-aloud
│   │   │   ├── AIQuestionAssistant.jsx   # Gemma / LangChain categorized question bank
│   │   │   ├── IntegrityMonitorPanel.jsx # Real-time tab switch, focus loss & paste telemetry
│   │   │   ├── DocumentConsistencyPanel.jsx # Cross-checks resume claims vs background checks
│   │   │   ├── InterviewHeader.jsx       # Navigation breadcrumb & session progress bar
│   │   │   ├── InterviewHistory.jsx      # Collapsible completed Q&A transcript log
│   │   │   ├── InterviewCompletion.jsx   # Post-session summary with final integrity metrics
│   │   │   ├── EndInterviewModal.jsx     # End session confirmation dialog
│   │   │   ├── EthicalConsentModal.jsx   # Pre-interview proctoring disclosure & consent
│   │   │   └── VoiceRecorder.jsx         # Candidate voice recording interface with waveform
│   │   │   ├── EmailLinkNotice.jsx       # Inbox instructions and resend link action
│   │   │   ├── OtpVerification.jsx       # Legacy demo OTP used by recovery UI
│   │   │   └── ForgotPasswordFlow.jsx    # Demo recovery flow (Email -> demo OTP -> New Password)
│   │   ├── ui/                           # Primitives: Button, Card, Badge, Modal, Input, etc.
│   │   │   └── Toast.jsx                 # Hot toast notification system & <Toaster />
│   │   ├── candidate/                    # TrustGauge, FindingCard, AIChat, CandidateCard
│   │   ├── dashboard/                    # StatCard, ActivityFeed, TrustDistribution
│   │   └── landing/                      # Navbar, Hero, Features, HowItWorks, Footer
│   │
│   ├── lib/
│   │   ├── api.js                        # Unified fetch client with offline fallbacks
│   │   ├── constants.js                  # Demo data, thresholds, and questions
│   │   ├── utils.js                      # Formatting, score colors, Tailwind merge
│   │   ├── interviewData.js              # Backward-compatible re-export for interview mocks
│   │   └── interview/                    # Dedicated Interview Engine Service Layer
│   │       ├── api.js                    # 12 service functions with mock fallbacks
│   │       ├── config.js                 # API endpoints, thresholds, and config map
│   │       ├── mockData.js               # Resume data, question templates, AI answer pools
│   │       └── types.js                  # JSDoc schema specifications
│   │
│   ├── INTERVIEW_API_CONTRACT.md         # Full REST API specification for Whisper & Gemma
│   └── package.json                      # Dependencies and build scripts
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

Candidate and HR signup, password login, and click-to-sign-in links use the Next.js MongoDB auth routes. Signup stores a pending OTP challenge in `auth_otps`; the user profile is added to `users` only after a correct, unexpired code. Passwords use scrypt hashes. Nodemailer sends OTPs and one-time sign-in links via Gmail; the link token is stored as a hash in `auth_links`.

Candidate forms retain CAPTCHA checks. Browser sessions stay in `sessionStorage` and are navigation guards only; the Python data APIs still need server-side authorization before production use. The former Firebase Auth/Firestore code and credentials have been removed. Firebase accounts are not migrated, so those users need to create a new MongoDB account.

## 5. AI Interview & Proctoring Architecture (Candidate vs HR Separation)

```
┌─────────────────────────────────────────────────────────┐       ┌─────────────────────────────────────────────────────────┐
│              CANDIDATE PORTAL                           │       │                   HR PORTAL                             │
│         /candidate/interview                            │       │    /dashboard/candidates/[id]/interview                 │
├─────────────────────────────────────────────────────────┤       ├─────────────────────────────────────────────────────────┤
│ • Unified camera + microphone permission request        │       │ • "Launch Interview Monitor" Control Center             │
│ • Dual video interface:                                 │       │ • Live Candidate Camera + Real-time Eye Gaze Tracking   │
│    - HR Interviewer Camera Tile (incoming feed)         │       │ • HR Interviewer Camera Broadcast Tile (with controls)  │
│    - Candidate Self-Preview (proctoring webcam)         │       │ • Background Integrity Telemetry (tab switches, blur)   │
│ • Reads/listens to active dispatched question           │ ────> │ • Live Whisper Speech-to-Text Transcription Feed        │
│ • Voice recorder with audio waveform & timer            │       │ • Automated AI-Generated Answer Detector (0–100% score) │
│ • Previews Whisper speech-to-text transcription         │       │ • Resume Document Scanner & Question Generator          │
│ • Submits answers to hiring team                        │       │ • Spontaneous Question Input & AI Question Bank         │
│ • Real-time tab-switch warnings (visible to candidate)  │       │ • Document Discrepancy Cross-Check (fake claims audit)  │
└─────────────────────────────────────────────────────────┘       └─────────────────────────────────────────────────────────┘
```

### Key Capabilities & Architecture:

1. **Candidate Voice Interaction & Whisper STT**:
   - Spoken responses recorded using browser `MediaRecorder` (`audio/webm;codecs=opus`).
   - Transcribed via backend Whisper API (`POST /api/interviews/{sessionId}/audio`).
   - Candidate can review/re-record before final submission.

2. **Real-Time Eye Gaze & Attention Tracking**:
   - `CameraMonitorPanel.jsx` samples webcam frames via `<canvas>` every 15 animation frames.
   - Uses browser `FaceDetector` API (or luminance variance fallback) to detect pupil/face centroid deviation.
   - Displays real-time status: **"Looking at screen"** (Green) vs. **"Eyes away from screen"** (Amber).
   - Tracks continuous **Attention Score %** and flags prolonged look-aways (>3s).

3. **AI-Generated Answer Detection Engine**:
   - Analyzes transcribed responses (`POST /api/interviews/{sessionId}/analyze-response`).
   - Checks vocabulary complexity, sentence syntactic uniformity, and filler word density (detects missing natural pauses like "um"/"uh").
   - Output verdicts:
     - 🟢 *Natural Spoken Response* (e.g. Sarah Chen: ~18% AI score)
     - 🟡 *Review Required* (e.g. Priya Sharma: ~42% AI score)
     - 🔴 *High Probability AI Generated* (e.g. Marcus Rivera: ~88% AI score with warning alert)

4. **Resume-Based Question Generation (Gemma / Ollama)**:
   - `ResumeQuestionGenerator.jsx` parses candidate resume data (skills, projects, experience).
   - One-click **"Ask"** button triggers `POST /api/interviews/{sessionId}/questions/from-resume`, generating a targeted technical question via Gemma/LLM templates and dispatching it directly to the candidate's screen.

5. **Balanced 2-Column Responsive Layout (HR Portal)**:
   - Uses a rock-solid `lg:col-span-5` (Left) and `lg:col-span-7` (Right) grid layout inside `max-w-7xl mx-auto`.
   - **Left Column**: Live video monitoring (Candidate Gaze Feed + HR Interviewer Tile) + Proctoring telemetry + HR Copilot tabbed tools.
   - **Right Column**: Current active question + Candidate Voice Response & AI speech evaluation review + Custom question input + Transcript history.
   - Completely eliminates horizontal scrolling, dropped columns, and squished 1-letter text wrapping.

---

## 6. Demo Candidates & Scenario Data

The database comes pre-seeded on backend startup (`app/demo/seed.py`) with three distinct candidate profiles designed for hackathon judging:

1. **Sarah Chen** (`cand-sarah-001`) — **High Trust (Score: 87.0)**
   - Role: Senior Frontend Engineer
   - Verification: All employment dates match LinkedIn, AWS Certificate verified, GitHub profile active since 2019, 0 proctoring tab switches.
   - Spoken Answer: Natural colloquial speech with personal project context, 18% AI score (Natural).
2. **Marcus Rivera** (`cand-marcus-002`) — **Critical Risk (Score: 42.0)**
   - Role: Full Stack Developer
   - Red Flags:
     - Resume claims 2020–2023 Senior Dev at TechCorp; LinkedIn shows Junior Dev 2021–2022. Overlaps with DataFlow Inc.
     - Google Cloud Certificate PDF creation date is March 2024 despite claimed Jan 2022 issue date (Author: "Template User").
     - GitHub created 2 months ago despite claiming 4+ years open-source contributions.
     - Live interview: 7 tab switches away, 4 clipboard paste bursts, and 88% AI score (Likely AI-generated).
3. **Priya Sharma** (`cand-priya-003`) — **Needs Review (Score: 64.0)**
   - Role: Backend Engineer
   - Mixed Signals: Azure certificate verification URL returns 404 (expired link), 3 proctoring tab switches, identity checks clean. Spoken answer AI score 42% (Needs Review).

---

## 7. How to Run the Project Locally

The frontend and backend must both be running. Starting only Next.js still lets pages render, but demo sign-in and interview session creation will fail because they call the FastAPI service on port `8000`.

### Terminal 1: Backend (FastAPI)
```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- Candidates list: `http://localhost:8000/api/candidates`
- Confirm the health check returns `200` before testing demo sign-in or creating interview links.
- Demo password sign-in requires `DEMO_MODE=true`, `DEMO_AUTH_ENABLED=true`, and matching `DEMO_HR_*` / `DEMO_CANDIDATE_*` values in the ignored `backend/.env`. The local demo emails are `hr@gmail.com` and `test@gmail.com`; passwords are configured locally and must not be committed.

### Terminal 2: Frontend (Next.js)
```bash
cd frontend
pnpm run dev
```
- App runs at: `http://localhost:3000`
- Landing page: `http://localhost:3000`
- Dual Portal Selector: `http://localhost:3000/login`
- Candidate Portal: `http://localhost:3000/candidate`
- Candidate Interview Room: `http://localhost:3000/candidate/interview`
- HR Dashboard: `http://localhost:3000/dashboard`
- Candidate Profile: `http://localhost:3000/dashboard/candidates/cand-sarah-001`
- Live HR Interview Monitor: `http://localhost:3000/dashboard/candidates/cand-sarah-001/interview`

### HR Interview Link Flow

1. Sign in to the HR portal and open **Interviews**.
2. Choose **Open HR Monitor** for a candidate, then select **Launch Interview Monitor**. Launching creates the active backend interview session.
3. After the session is created, the monitor displays **Share this interview** with a copyable candidate URL. The link is not available on the Interviews list or before monitor launch because it needs the session ID.
4. The candidate opens the shared URL and signs in through the Candidate portal. The URL's `session_id` is preserved through sign-in and opens that active interview room.

The local URL uses `localhost:3000`, which points to the current computer. It works for a candidate using the same computer, but not for a candidate on another device. For remote candidates, host the frontend and backend on reachable addresses, configure the frontend API base URL and backend `FRONTEND_ORIGINS` for those addresses, and share the hosted URL. Interview data uses an in-memory database in demo mode, so keep the backend running for the entire session; restarting it clears active demo sessions.

If Firefox reports that it cannot connect to `localhost:3000`, check that the frontend is running. If login or **Launch Interview Monitor** fails after the frontend loads, check `http://localhost:8000/health` and start the backend as well.

---

## 8. Testing & Verification Status

- **Frontend Compilation**: Verified with `next build` (Next.js 16.4.6 with Turbopack). All routes compile statically/dynamically with **0 errors**.
- **Backend Test Suite**: Tested with `python run_full_verification.py`. All 11 test assertions passed (CRUD, calculations, AI fallbacks, interview telemetry, and document parsing).
- **Historical baseline (before the MongoDB auth changes)**: `next build` was previously reported to compile all 21 routes, and `python run_full_verification.py` passed all 11 backend module checks. These checks have not been rerun against the current auth changes.
- **Current auth work**: Targeted ESLint and `git diff --check` passed after MongoDB auth wiring. A full frontend build and end-to-end mail delivery flow have not been run.
- **Known lint baseline**: The earlier full ESLint run reported 31 errors and 7 warnings across interview, dashboard, and UI files. Targeted auth lint passed after MongoDB auth wiring.
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
- **API Contract**: Defined in `frontend/INTERVIEW_API_CONTRACT.md` detailing schemas for Whisper, Gemma, LangChain, and WebRTC streaming.

---

## 9. Recent Architectural Changes & Updates (Changelog)

### A. Complete Interview System Redesign & Role Separation
- **Separation of Concerns**: Moved voice recording and answer submission to the **Candidate Portal** (`/candidate/interview`). Moved eye gaze tracking, question generation, and AI speech analysis to the **HR Portal** (`/dashboard/candidates/[id]/interview`).
- **HR Camera Tile Placeholders**: Created reusable `HRCameraTile.jsx` mounted in both portals (Candidate sees HR interviewer tile; HR sees self-preview with broadcast controls).
- **Rock-Solid Responsive Layout**: Fixed 3-column squishing by implementing a robust 2-column layout (`5 cols + 7 cols`) inside `max-w-7xl mx-auto`. Skills render as flex chips; no 1-letter text wrapping or horizontal overflow.
- **Eye Movement & Attention Tracking**: Built canvas-based gaze estimation into `CameraMonitorPanel.jsx` with real-time status and look-away counters.
- **AI-Generated Answer Detection**: Built `CandidateAnswerReview.jsx` with 0–100% AI Likelihood Score, signal breakdown, and manual flag action.

### B. Candidate-Driven Onboarding Enforcement
- **HR Cannot Add Candidates**: Candidates self-register and submit documents via `/candidate/apply`. Removed obsolete manual creation routes.

### C. Removed Direct Public Profile Bypass ("View Marcus Rivera Dossier")
- Removed the public "View Marcus Rivera Dossier" button on the landing page (`frontend/app/page.js`), enforcing that all candidate dossiers and trust records remain gated behind the authenticated HR portal.

### D. MongoDB Persistence and Authentication
- MongoDB Atlas is the only persistent database adapter; demo mode continues to use the in-memory mock database.
- Candidate and HR signup uses a pending email OTP challenge, and account records are inserted into `users` only after verification. Passwords are scrypt hashes; OTP and email-link values are stored as hashes.
- Nodemailer sends Gmail OTPs and sign-in links. Server configuration lives in ignored environment files.
- Removed the unused Firebase Web SDK, Firebase Admin/Firestore adapter, Firebase Storage branch, token-verification endpoint, Firestore seed script, Firebase environment variables, and related dependencies.

### G. Candidates Directory Revamp & Sidebar Streamlining
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

### H. Animated Verification Interstitials for Document Submissions
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

### H. UI Polish: Header Cleanliness & Horizontal Trust Score Bar
- **Removed "MVP" & "Acme Enterprise"**:
  - Removed the `"MVP"` badge next to the TrustHire logo in the dashboard sidebar (`frontend/app/dashboard/layout.jsx`).
  - Removed `"Acme Enterprise"` from the recruiter profile badge in the dashboard top navigation bar (`frontend/app/dashboard/layout.jsx`), keeping only the clean `"Lead Recruiter"` designation.
- **Added Horizontal Trust Score Indicator Bars**:
  - In the Candidates Directory table list view (`frontend/app/dashboard/candidates/page.jsx`), added a sleek horizontal progress bar under the trust score numbers (`87/100`, `42/100`, `64/100`), dynamically filled to the candidate's exact score and colored according to risk levels (green for high trust, red for critical review, amber for needs review).
  - Also added the matching horizontal score bar to candidate cards (`frontend/components/candidate/CandidateCard.jsx`) for visual consistency across view modes.

### I. Collapsible Sidebar & Swapping Transition Animations
- **Collapsible Sidebar (Open by Default)**:
  - Added collapsible state `isCollapsed = false` (default open) in `frontend/app/dashboard/layout.jsx`.
  - Smooth width transition: `w-64` when open and `w-20` when collapsed with `transition-all duration-300 ease-in-out`.
  - Added collapse/expand controls:
    - Sidebar header toggle button (`PanelLeftClose`).
    - Collapsed quick expand action button (`PanelLeft`).
    - Header search bar quick toggle button (`PanelLeft` / `PanelLeftClose`).
  - Collapsed state displays centered navigation icons with floating hover tooltips and an interactive compact pulse indicator for Gemma 4 AI status.
- **Swapping Transition Animations**:
  - **Sliding Active Pill**: An active indicator backdrop pill (`bg-indigo-50/90 border border-indigo-200/70 shadow-2xs`) glides vertically between navigation items with cubic-bezier physics (`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`) whenever an element is clicked.
  - **Left Edge Accent Bar**: An indigo accent bar glides along with the active pill.
  - **Page Content Swapping**: The `<main>` element includes `key={pathname}` with an animated fade transition (`animate-in fade-in-50 duration-200`) so switching views feels smooth and responsive.

### J. Single Global Back Navigation & Recruiter Identity
- **Single Back Button per Page**:
  - Maintained the persistent Back button (`<button onClick={() => router.back()}><ArrowLeft /> Back</button>`) directly in the sticky top navigation bars of both the **HR Dashboard** (`frontend/app/dashboard/layout.jsx`) and the **Candidate Portal** (`frontend/app/candidate/layout.jsx`).
  - Audited and eliminated all duplicate in-page Back buttons across all views (`candidates/page.jsx`, `reports/page.jsx`, `settings/page.jsx`, `credentials/page.jsx`, `identity/page.jsx`, `candidates/[id]/page.jsx`, `candidates/[id]/interview/page.jsx`, `candidate/page.jsx`, `candidate/apply/page.jsx`, `candidate/status/page.jsx`, `candidate/interview/page.jsx`), ensuring strictly **only 1 Back button/option** exists on every page.
- **HR Identity Display ("Reiner Hemming")**:
  - Updated the recruiter profile widget in `frontend/app/dashboard/layout.jsx` to render **"Reiner Hemming"** in muted text directly underneath **"Lead Recruiter"**, matching the profile avatar initials **RH**.

### K. Sidebar Toggle Button Clean-up
- **Single Sidebar Toggle in `<aside>`**:
  - Removed the duplicate/redundant secondary sidebar toggle button from the dashboard top navigation header.
  - Kept strictly **only 1 sidebar toggle button**, cleanly positioned inside the sidebar header itself:
    - When expanded: clicking the `PanelLeftClose` icon collapses the sidebar to compact icon-only mode (`w-20`).
    - When collapsed: clicking the centered `PanelLeft` icon expands the sidebar back to its default open state (`w-64`).

### L. Candidate Portal Smooth Transition Animations
- **Horizontal Sliding Active Indicator**:
  - Added a dynamic measurement-based sliding active pill backdrop (`bg-emerald-50 border border-emerald-200 shadow-2xs`) in `frontend/app/candidate/layout.jsx`.
  - Glides smoothly between `Portal Home`, `Submit Documents`, `Join Interview Room`, and `Application Status` using cubic-bezier easing (`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`).
  - Added gentle icon hover scaling (`group-hover:scale-110`) and smooth label color transitions.
- **Page Swapping Transition**:
  - Mounted `<main key={pathname} className="animate-in fade-in-50 duration-200">` in the candidate layout so transitioning between candidate pages provides the same seamless swapping fade effect as the recruiter dashboard.

---

## 10. Immediate Next Steps / Roadmap for Contributors

1. **Connect Live Whisper Backend**: Connect `POST /api/interviews/{sessionId}/audio` to a local `faster-whisper` instance.
2. **Connect Live Gemma 4 Model**: Configure `GEMMA_API_BASE_URL` in `backend/.env` targeting local Ollama (`ollama run gemma:7b`).
3. **WebRTC Video Signaling**: Replace simulated WebRTC tile feeds with live peer-to-peer signaling using Simple-Peer or LiveKit.
If you are picking up work on this project, consider these high-leverage enhancements:
1. **Add server-side authorization**: Protect the Python data APIs using authenticated MongoDB-backed sessions.
3. **Real Gemma 4 Connection**: Configure `GEMMA_API_KEY` and `GEMMA_API_BASE_URL` in `backend/.env` to connect to a live Ollama or Vertex AI instance instead of demo mock responses.
4. **Real WebRTC / Camera Feed**: Enhance `frontend/app/dashboard/candidates/[id]/interview/page.jsx` with real face-mesh or face-api.js detection for multi-face detection.
5. **PDF Report Export**: Wire up client-side PDF export (e.g., using `jspdf` or `html2canvas`) on `/dashboard/reports` and candidate profiles.
