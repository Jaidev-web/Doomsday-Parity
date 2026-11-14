# TrustHire — Project Context & Developer Handover Guide

> **Document Purpose**: This file provides complete onboarding context for anyone continuing development on TrustHire. It covers what has been built, the architecture, technical decisions, file structure, demo data, test verification, and immediate next steps.

---

## 1. Project Overview & Core Vectors

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
5. **Document Forensics & Persistent Storage**: SHA-256 deduplicated file ingestion, magic-byte type validation, MongoDB GridFS storage, and Gemma 4 advisory review pipeline.

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Key Architectural Decision |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React | Single-page and dashboard components built in `.jsx` for rapid iteration. Uses Tailwind CSS compiled into `app/tailwind.css`. Global `<Toaster />` mounted in root `layout.js` for reactive event notifications. |
| **Authentication & Security** | MongoDB native auth, Scrypt hashing, HMAC-SHA256 JWT tokens, Nodemailer, Canvas API | Dual-portal authentication suite. Email/password with scrypt hashing, 6-digit expiring email OTP verification via Nodemailer, passwordless sign-in links, and candidate visual Canvas anti-bot CAPTCHA. Session security uses 12-hour HMAC JWT tokens validated server-side by both Next.js and FastAPI. |
| **Interview & Proctoring** | MediaRecorder API, HTML5 Canvas, FaceDetector API, WebRTC / WebM | Dedicated role-separated interview engine. Canvas-based eye gaze estimator with pupil/face centering heuristics and attention scoring. Dual-tile video architecture for candidate and interviewer feeds. |
| **Speech-to-Text & AI Detection** | Local Whisper, Ollama + Gemma 4, LangChain | Voice recording via MediaRecorder (WebM/Opus) transcribing into text. Spoken answers analyzed via AI response detector (0–100% LLM score based on vocabulary complexity, filler density, and syntactic uniformity). |
| **Backend & APIs** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, PyMongo | Modular REST API with route segregation. `DatabaseManager` selects in-memory demo data (`MockDB`) or persistent MongoDB Atlas (`MongoDB`) based on `DEMO_MODE` / `DATABASE_BACKEND`. Server-side token validation via `app/security.py`. |
| **AI Layer** | Gemma 4 integration via `AIService` & LangChain context | Supports live Gemma endpoints with automatic fallback to realistic `[Demo Mode]` responses if no API key is provided. Configured for `gemma4:e4b`. |
| **Documents & Storage** | MongoDB GridFS, PyPDF2, python-docx, Pillow | Magic-byte signature checks, SHA-256 content deduplication, GridFS binary storage, and forensic PDF metadata extraction (`/Author`, `/CreationDate`) for tamper detection. |

---

## 3. Repository Structure & File Map

```
Doomsday-Parity/
├── backend/                              # FastAPI application
│   ├── app/
│   │   ├── main.py                       # FastAPI entry point, CORS, router inclusion
│   │   ├── config.py                     # Environment settings (DEMO_MODE, GEMMA, MongoDB)
│   │   ├── security.py                   # Server-side HMAC token authorization (current_user, candidate_user, hr_user)
│   │   ├── models/                       # Pydantic schemas
│   │   │   ├── candidate.py              # CandidateCreate, CandidateUpdate, ApplicationSubmission, CandidateResponse
│   │   │   ├── document.py               # DocumentResponse, DocumentUpload, DocumentVerification
│   │   │   ├── verification.py           # VerificationResult schema
│   │   │   ├── interview.py              # InterviewEvent, InterviewSession, Report
│   │   │   └── ai_review.py              # AIQuestion, AIResponse, AIHistory
│   │   ├── db/
│   │   │   ├── manager.py                # Database factory (MockDB or MongoDB)
│   │   │   ├── mock_db.py                # Thread-safe in-memory store
│   │   │   └── mongodb.py                # PyMongo CRUD & GridFS document storage adapter
│   │   ├── demo/
│   │   │   └── seed.py                   # Pre-seeded test candidates (Sarah, Marcus, Priya)
│   │   ├── services/
│   │   │   ├── ai_service.py             # Gemma 4 LLM client with advisory document review
│   │   │   ├── trust_service.py          # Rule-based 0-100 trust scoring algorithm
│   │   │   ├── credential_service.py     # Resume & cert metadata cross-referencing
│   │   │   ├── identity_service.py       # Name consistency & PAN verification
│   │   │   ├── interview_service.py      # Suspicious event aggregation & reporting
│   │   │   └── document_service.py       # PDF/DOCX text & metadata extractors
│   │   └── routers/                      # REST API endpoints
│   │       ├── candidates.py             # CRUD /api/candidates & /api/candidates/me/application
│   │       ├── documents.py              # Upload, streaming download & retry review
│   │       ├── credentials.py            # /api/candidates/{id}/credentials
│   │       ├── identity.py               # /api/candidates/{id}/identity
│   │       ├── interviews.py             # /api/interviews (create, log events, report, audio)
│   │       ├── trust.py                  # /api/candidates/{id}/trust/calculate
│   │       └── ai_assistant.py           # /api/candidates/{id}/ai/ask & history
│   ├── requirements.txt                  # Python dependencies
│   ├── run_full_verification.py          # Standalone 11-point backend test script
│   └── seed_mongodb_demo.py              # Idempotent Atlas demo seeder
│
├── frontend/                             # Next.js 16 Web Application
│   ├── app/                              # Next.js App Router
│   │   ├── layout.js                     # Root layout importing tailwind.css & mounting <Toaster />
│   │   ├── page.js                       # Public landing page (Hero, Features, HowItWorks, AI)
│   │   ├── globals.css                   # Custom theme variables
│   │   ├── tailwind.css                  # Compiled Tailwind utility classes
│   │   ├── api/auth/                     # Server-side MongoDB Auth Routes
│   │   │   ├── signup/route.js           # Password hash & email OTP challenge dispatch
│   │   │   ├── verify-otp/route.js       # OTP verification & user account creation
│   │   │   ├── login/route.js            # Password authentication & 12h token issuance
│   │   │   ├── email-link/request/route.js# Passwordless sign-in link generation & email dispatch
│   │   │   └── email-link/consume/route.js# Consumes one-time magic link & issues token
│   │   ├── auth/email-link/page.jsx      # Magic link landing handler (wrapped in Suspense)
│   │   ├── login/                        # Role-Segregated Login Entry
│   │   │   ├── page.jsx                  # Direct redirect to /login/candidate
│   │   │   ├── candidate/page.jsx        # Candidate Sign In / Sign Up, Captcha, OTP & Reset
│   │   │   └── hr/page.jsx               # HR Sign In / Sign Up, 2FA OTP & Reset
│   │   ├── signup/                       # Direct Registration Entry Points
│   │   │   ├── candidate/page.jsx        # Dedicated candidate registration wrapper
│   │   │   └── hr/page.jsx               # Dedicated HR team registration wrapper
│   │   ├── candidate/                    # SECTION 1: CANDIDATE ONLY PORTAL
│   │   │   ├── layout.jsx                # Candidate portal header & sliding navigation
│   │   │   ├── page.jsx                  # Candidate portal home & action cards
│   │   │   ├── apply/page.jsx            # Document upload wizard & persistent application form
│   │   │   ├── interview/page.jsx        # Live voice assessment room (dual camera & voice recorder)
│   │   │   └── status/page.jsx           # Real-time application & document verification status
│   │   └── dashboard/                    # SECTION 2: HR ONLY PORTAL
│   │       ├── layout.jsx                # Recruiter navigation shell with collapsible sidebar
│   │       ├── page.jsx                  # Operations Hub overview & statistics
│   │       ├── candidates/
│   │       │   ├── page.jsx              # Candidate directory (List/Grid view, in-row modals)
│   │       │   └── [id]/
│   │       │       ├── page.jsx          # Candidate dossier (Gauge, Findings, Documents Tab, AI Chat)
│   │       │       └── interview/page.jsx# Live HR Interview Monitor & Proctoring Center
│   │       ├── credentials/page.jsx      # Credential audits list
│   │       ├── identity/page.jsx         # Identity audits list
│   │       ├── interviews/page.jsx       # Interview sessions list with "Open HR Monitor"
│   │       ├── reports/page.jsx          # Cohort risk distribution analytics
│   │       └── settings/page.jsx         # Demo mode & Gemma model settings
│   │
│   ├── components/
│   │   ├── auth/                         # Authentication & Security Components
│   │   │   ├── Captcha.jsx               # Canvas anti-bot challenge with audio readout
│   │   │   ├── OtpVerification.jsx       # 6-digit individual box inputs with countdown
│   │   │   ├── ForgotPasswordFlow.jsx    # 3-step recovery flow (Email -> OTP -> New Password)
│   │   │   ├── EmailLinkNotice.jsx       # Email sent instruction tile & resend action
│   │   │   └── RoleSessionGuard.jsx      # Client-side tab route guard
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
│   │   │   ├── EyeGazeTracker.jsx        # Canvas pupil deviation tracker
│   │   │   └── VoiceRecorder.jsx         # Candidate voice recording interface with waveform
│   │   ├── ui/                           # Primitives: Button, Card, Badge, Modal, Input, Toast, etc.
│   │   │   └── Toast.jsx                 # Hot toast notification system & <Toaster />
│   │   ├── candidate/                    # TrustGauge, FindingCard, AIChat, CandidateCard, VerificationAnimationModal
│   │   ├── dashboard/                    # StatCard, ActivityFeed, TrustDistribution
│   │   └── landing/                      # Navbar, Hero, Features, HowItWorks, Footer
│   │
│   ├── lib/
│   │   ├── api.js                        # Unified fetch client with Bearer auth token attachment
│   │   ├── auth-session.js               # Browser sessionStorage session & accessToken manager
│   │   ├── mongo-auth.js                 # Client wrapper for /api/auth/* endpoints
│   │   ├── server/mongo-auth.js          # Server-only MongoDB driver, scrypt hasher, Nodemailer mailer, JWT issuer
│   │   ├── constants.js                  # Demo data, thresholds, and questions
│   │   ├── utils.js                      # Formatting, score colors, Tailwind merge
│   │   ├── interviewData.js              # Backward-compatible re-export for interview mocks
│   │   └── interview/                    # Dedicated Interview Engine Service Layer
│   │       ├── api.js                    # Service functions with auth headers & mock fallbacks
│   │       ├── config.js                 # API endpoints, thresholds, and config map
│   │       ├── mockData.js               # Resume data, question templates, AI answer pools
│   │       └── types.js                  # JSDoc schema specifications
│   │
│   ├── INTERVIEW_API_CONTRACT.md         # Full REST API specification for Whisper & Gemma
│   └── package.json                      # Dependencies and build scripts
│
├── .env.example                          # Root environment variable template
├── .gitignore                            # Standard Node, Python, Next.js ignores
├── README.md                             # Project overview and run instructions
└── context.md                            # THIS FILE — Onboarding and technical context
```

---

## 4. Authentication & Security Architecture

### Role-Segregated Entry (No Intermediate Selector)
- `/login` automatically redirects straight to `/login/candidate`.
- Candidates and recruiters land directly on their respective card-based login interfaces:
  - **Candidate Login** (`/login/candidate`): Emerald theme (`#059669`). Includes anti-bot visual CAPTCHA, password login, email-link sign-in, and pre-fill for demo candidate Sarah Chen.
  - **HR / Recruiter Login** (`/login/hr`): Indigo/Slate theme (`#4f46e5`). Includes password login, 2FA OTP toggle, corporate email validation, and pre-fill for demo recruiter account.
- Top navigation in both views provides a clean `"← Back to Home"` button and an instant cross-role switch (`"HR Login →"` / `"Candidate Login →"`).

### MongoDB-Backed Auth & Token Pipeline
- **Account Registration (`/api/auth/signup`)**:
  - Validates email and password (minimum 8 characters).
  - Generates a 6-digit random OTP, hashes it with SHA-256, and stores it in the `auth_otps` collection with a 10-minute TTL index.
  - Sends the code via Gmail using Nodemailer.
  - User record is created in the `users` collection only after correct OTP validation (`/api/auth/verify-otp`). Passwords are encrypted using Node.js `crypto.scrypt`.
- **Passwordless Sign-In (`/api/auth/email-link/request`)**:
  - Generates a cryptographically secure random token, stores its SHA-256 hash in `auth_links` with a 15-minute TTL, and emails a one-time sign-in link.
  - `/auth/email-link/page.jsx` consumes the link and signs in without a password.
- **12-Hour HMAC Access Token**:
  - Upon successful login, OTP completion, or email-link verification, `issueAccessToken` in `frontend/lib/server/mongo-auth.js` mints an `HS256` token containing `sub` (user ID), `email`, `role`, `iat`, `exp`, and `iss: 'trusthire'`.
  - The signature is calculated using `AUTH_SESSION_SECRET`.
  - The token is saved in browser `sessionStorage` (`accessToken`) and sent as `Authorization: Bearer <token>` on all subsequent API requests.
- **Backend FastAPI Enforcement (`backend/app/security.py`)**:
  - Fast, self-contained JWT validation: verifies the HMAC-SHA256 signature against `settings.AUTH_SESSION_SECRET`, checks expiration, issuer, and role.
  - `current_user`: Requires a valid signed-in user.
  - `candidate_user`: Requires `role == "candidate"`.
  - `hr_user`: Requires `role == "hr"`.
  - Candidate application endpoints and document uploads verify account ownership; HR endpoints protect candidate dossiers and audit controls.

### Anti-Bot Visual CAPTCHA (`<Captcha />`)
- HTML5 Canvas security challenge generating randomized distorted alphanumeric strings with background noise dots and bezier curves.
- Includes a refresh button and Web Speech API (`SpeechSynthesis`) audio readout.
- Candidate registration and login enforce CAPTCHA resolution prior to credential verification.

---

## 5. Document Forensics, GridFS Storage, & Gemma Review Pipeline

### File Ingestion & Security
- **Endpoints**: `POST /api/candidates/me/documents` (authenticated candidate) and `POST /api/candidates/{id}/documents` (authenticated HR).
- **Magic-Byte Signature Verification**: Rejects files whose content does not match allowed magic bytes (`%PDF-`, PNG header, JPEG header, DOCX zip header).
- **SHA-256 Deduplication**: Calculates file hash and checks for duplicates within the candidate's existing records. Re-uploading an existing file returns the current record without duplicating storage.
- **GridFS Binary Storage**: Binary file payloads are streamed into MongoDB GridFS (`fs.files`, `fs.chunks`). Storage paths are kept private (`gridfs:<id>`) and never exposed in public API responses.
- **Document Versioning**: Uploading a replacement for an existing document type (e.g., a newer resume) marks earlier versions `is_current=False` while retaining audit history.

### Gemma 4 Advisory Review
- Background task `_run_gemma_review` is queued on upload.
- Invokes `ai_service.review_uploaded_document` with strict JSON mode against configured Gemma 4 endpoints.
- Extracts key fields, summarizes content, and lists potential risk concerns.
- **Human-in-the-Loop Guarantee**: The review is purely advisory and always sets `requires_human_review=True`. It never marks documents as verified on its own.
- Documents with unparseable or image-only text are assigned `pending_ocr` status.
- HR recruiters can manually trigger a retry via `POST /api/documents/{doc_id}/verify`.

### HR Dossier Documents Panel
- Located under the **Documents** tab in `/dashboard/candidates/[id]`.
- Displays all current uploaded documents with type, filename, file size, SHA-256 hash, and upload timestamp.
- Renders Gemma advisory review summaries, extracted candidate data, and identified concerns.
- Includes an authenticated streaming download button (`GET /api/documents/{doc_id}/download`) and a "Retry Review" action.

---

## 6. AI Interview Engine & Candidate Integrity Monitoring

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

1. **Candidate Voice Interaction & Whisper STT**:
   - Spoken responses recorded using browser `MediaRecorder` (`audio/webm;codecs=opus`).
   - Transcribed via backend Whisper API (`POST /api/interviews/{sessionId}/audio`).
   - Candidate can review/re-record before final submission.
2. **Real-Time Eye Gaze & Attention Tracking**:
   - `CameraMonitorPanel.jsx` samples webcam frames via `<canvas>` every 15 animation frames.
   - Uses browser `FaceDetector` API (or luminance variance fallback) to detect pupil/face centroid deviation.
   - Real-time status: **"Looking at screen"** (Green) vs. **"Eyes away from screen"** (Amber). Tracks continuous **Attention Score %** and flags prolonged look-aways (>3s).
3. **AI-Generated Answer Detection Engine**:
   - Analyzes transcribed responses (`POST /api/interviews/{sessionId}/analyze-response`).
   - Evaluates vocabulary complexity, syntactic uniformity, and filler word density.
   - Verdicts:
     - 🟢 *Natural Spoken Response* (e.g. Sarah Chen: ~18% AI score)
     - 🟡 *Review Required* (e.g. Priya Sharma: ~42% AI score)
     - 🔴 *High Probability AI Generated* (e.g. Marcus Rivera: ~88% AI score)
4. **Resume-Based Question Generation (Gemma / Ollama)**:
   - `ResumeQuestionGenerator.jsx` parses candidate resume data (skills, projects, experience).
   - "Ask" button triggers `POST /api/interviews/{sessionId}/questions/from-resume`, generating a targeted technical question via Gemma/LLM templates and dispatching it directly to the candidate's screen.
5. **Interview Link Flow**:
   - Recruiter launches monitor on `/dashboard/interviews` -> creates active backend interview session.
   - Copyable candidate URL (`/candidate/interview?session_id=...`) is generated.
   - Candidate signs in; the `session_id` query param is preserved through authentication and connects directly into the proctored assessment room.

---

## 7. Demo Candidates & Scenario Data

Pre-seeded on backend startup (`app/demo/seed.py`) and idempotent Atlas seeder (`seed_mongodb_demo.py`):

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

## 8. Environment Variables & Configuration Guide

Keep secrets in ignored `.env` (backend) and `.env.local` (frontend). The root `.env.example` documents all supported variables:

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend Mode & Persistence
DEMO_MODE=true                        # Set to false for persistent MongoDB Atlas
DATABASE_BACKEND=mongodb
MONGODB_URI=mongodb+srv://...         # Your MongoDB Atlas connection URI
MONGODB_DATABASE=trusthire

# Authentication Secrets (Shared between Next.js & FastAPI)
AUTH_SESSION_SECRET=                  # Required for 12h HMAC JWT token signing & verification
AUTH_OTP_SECRET=                      # Secret used for OTP challenges

# Gmail Nodemailer (for OTP and magic link delivery)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Gemma 4 AI (optional — fallback mocks used if not reachable)
GEMMA_API_KEY=
GEMMA_API_BASE_URL=http://localhost:11434/api
GEMMA_MODEL=gemma4:e4b
```

---

## 9. How to Run the Project Locally

Both services must be running for full end-to-end functionality.

### Terminal 1: Backend (FastAPI)
```bash
cd backend
source ../.venv/bin/activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- Candidates list: `http://localhost:8000/api/candidates`
- Verify `http://localhost:8000/health` returns `200` before logging in or creating interview sessions.

### Terminal 2: Frontend (Next.js)
```bash
cd frontend
pnpm run dev
```
- Public Landing Page: `http://localhost:3000`
- Direct Candidate Login: `http://localhost:3000/login/candidate`
- Direct HR Recruiter Login: `http://localhost:3000/login/hr`
- Candidate Portal: `http://localhost:3000/candidate`
- Candidate Application Wizard: `http://localhost:3000/candidate/apply`
- Candidate Interview Room: `http://localhost:3000/candidate/interview`
- HR Dashboard: `http://localhost:3000/dashboard`
- Candidate Dossier: `http://localhost:3000/dashboard/candidates/cand-sarah-001`
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

### B. Direct Login Experience (Removed Intermediate Selector)
- Removed the intermediate "Select Your Access Portal" card grid.
- `/login` now redirects immediately to `/login/candidate`.
- Both login views provide direct tabs (Sign In / Register), visual CAPTCHAs, demo pre-fill buttons, and top navigation links for `"← Back to Home"` and `"Candidate Login →"` / `"HR Login →"`.

### C. Voice-Enabled AI Interviewer & Candidate Integrity Monitoring
- **Role Separation**: Split live interview features into Candidate Room (`/candidate/interview`) and HR Monitor (`/dashboard/candidates/[id]/interview`).
- **Whisper Voice-to-Text**: Added audio recording and speech transcription.
- **AI-Generated Answer Detection**: 0–100% LLM likelihood score based on syntactic uniformity, filler word density, and vocabulary complexity.
- **Eye Movement & Gaze Tracking**: Real-time canvas pupil/face deviation tracking with continuous attention scoring.
- **Resume Question Generator**: Dynamic Gemma challenge generation dispatched directly to candidate view.
- **Shareable Session Link Flow**: Launching the monitor generates an active session ID preserved through candidate authentication.

### D. UI Polish & Navigation Refinements
- **Sidebar Streamlining**: Cleaned HR sidebar to Overview, Candidates, Interviews, Reports, Settings.
- **Interactive Candidate Cards**: Hover scale, in-row `{ Credentials, Identity }` detail modals with `stopPropagation()`, and horizontal Trust Score progress bars.
- **Single Back Navigation**: Kept strictly one back button per page in the global layout header.
- **Smooth Page Transitions**: Sliding active pill indicators and animated fade swapping transitions.

### M. Document Verification Pipeline & HR Dashboard Live Integration
- **Gemma 4 Document Verification Service (`backend/app/services/document_verification_service.py`)**:
  - Automatically triggered upon candidate document upload.
  - Specialized multi-prompt verification pipeline:
    - **Resume**: Prompts Gemma AI to extract employment timeline, verified skills, detect tenure conflicts, gaps, and calculate an overall risk tier (`low`, `medium`, `high`, `critical`).
    - **Certificate**: Checks issuing authority authenticity, issue/expiration date validity, and candidate name concordance.
    - **Identity Document**: Evaluates document completeness, government ID classification (passport, national ID, driver's license), and legal name matching.
  - Generates structured verification audit records conforming to TrustHire schema (`module`, `check_type`, `status`, `severity`, `title`, `explanation`, `evidence`, `source="gemma_ai"`).
- **FastAPI Endpoints (`backend/app/routers/documents.py`)**:
  - `POST /api/candidates/{id}/documents`: Ingests files, extracts text (PyPDF2, python-docx), invokes `document_verification_service.verify_document()`, stores verifications in database, and automatically triggers `trust_service.calculate_trust_score(candidate_id)`.
  - `GET /api/candidates/{id}/verifications`: Retrieves candidate's complete live verification history.
  - `POST /api/candidates/{id}/verify`: Re-evaluates all existing uploaded documents on-demand.
- **HR Dashboard Real-Time Integration (`frontend/app/dashboard/candidates/`)**:
  - `candidates/page.jsx`:
    - Reads candidates live from `api.candidates.list()` with fallback to demo data.
    - Clicking the interactive **Credentials** or **Identity** pills opens the verification inspection modal loaded with live Gemma AI checks.
    - Horizontal trust bar dynamically renders real-time trust score directly below the numerical rating.
  - `candidates/[id]/page.jsx`:
    - Added dedicated **"Documents"** tab alongside Overview, Credentials, Identity, and Interview Audit.
    - Shows all uploaded files (filename, file size, upload timestamp, extracted text preview) along with per-document Gemma AI findings.
- **Candidate Submission Flow (`frontend/app/candidate/apply/page.jsx`)**:
  - Uploads resume, certificate, and ID documents to the backend.
  - Automatically calculates and updates the candidate's real-time trust rating upon submission.
  - Presents candidate with a multi-vector completion card and direct navigation to the Interview Room.

---

## 12. Immediate Next Steps / Roadmap for Contributors

1. **Connect Live Whisper Backend**: Connect `POST /api/interviews/{sessionId}/audio` to a live local `faster-whisper` or OpenAI Whisper instance for real-time transcription.
2. **Connect Live Gemma 4 Model**: Start Ollama with `ollama run gemma4:e4b` or set `GEMMA_API_KEY` for Vertex AI to enable live LLM reasoning for advisory reviews and question generation.
3. **WebRTC Video Signaling**: Transition simulated dual-tile video feeds to live WebRTC streaming using LiveKit or Simple-Peer.
4. **Client-Side PDF Dossier Export**: Wire up PDF export (using `jspdf` or `html2canvas`) on `/dashboard/reports` and candidate dossiers.
5. **OCR Pipeline for Scanned Images**: Implement Tesseract or EasyOCR for image-only certificate and ID uploads currently marked `pending_ocr`.
