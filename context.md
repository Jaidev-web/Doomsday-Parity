# TrustHire — Project Context & Developer Handover Guide

> **Document Purpose**: This file provides complete onboarding context for anyone continuing development on TrustHire. It covers what has been built, the architecture, technical decisions, file structure, demo data, test verification, and immediate next steps.

---

## 1. Project Overview & Objective

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
5. **Dual-Portal Authentication System**: Role-segregated Candidate and HR/Recruiter entry points, candidate anti-bot CAPTCHA, Firebase email-link sign-in, password recovery UI, and reactive toast notifications. The Firebase migration is currently incomplete; see Section 4.

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Key Architectural Decision |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React | Single-page and dashboard components built in `.jsx` for rapid iteration. Uses Tailwind CSS compiled into `app/tailwind.css`. Global `<Toaster />` mounted in root `layout.js` for reactive event notifications. |
| **Authentication & Security** | Canvas API, SpeechSynthesis, Pub/Sub Toast Event Bus | Client-side dual authentication suite (Candidate & HR). Implements canvas distortion security CAPTCHAs with audio synthesis for candidates, 6-digit auto-advancing OTP boxes with resend countdowns, and 3-step password recovery. |
| **Interview & Proctoring** | MediaRecorder API, HTML5 Canvas, FaceDetector API, WebRTC / WebM | Dedicated role-separated interview engine. Canvas-based eye gaze estimator with pupil/face centering heuristics and attention scoring. Dual-tile video architecture for candidate and interviewer feeds. |
| **Speech-to-Text & AI Detection** | Local Whisper, Ollama + Gemma 4, LangChain | Voice recording via MediaRecorder (WebM/Opus) transcribing into text. Spoken answers analyzed via AI response detector (0–100% LLM score based on vocabulary complexity, filler density, and syntactic uniformity). |
| **Authentication & Security** | Firebase Authentication email-link sign-in, Canvas API, SpeechSynthesis, Pub/Sub Toast Event Bus | Firebase email-link sign-in is the intended flow. The client callback exists, but the backend ID-token/profile handoff still needs integration; see Section 4. |
| **Backend** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, httpx, firebase-admin | Modular REST API with route segregation. Uses a dynamic `DatabaseManager` to switch between an in-memory `MockDB` (for demo/local development) and `FirebaseDB` (for production persistence) based on `DEMO_MODE` environment toggle. |
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
│   │   ├── firebase.js                   # Firebase client and email-link helpers
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

Candidate and HR accounts support both Firebase email/password sign-in and email-link sign-in. New password accounts must verify their email before entering either portal. Signup creates a Firebase password account and sends a verification email; the email-link option sends a Firebase sign-in link. Existing email-link accounts can set a password from a verified sign-in link. Both Firebase paths obtain an ID token and call `/api/auth/verify-token`; the app session is stored only after backend verification succeeds. Candidate sign-in and signup also require the CAPTCHA. A local demo-login route is available for configured demo accounts only when both `DEMO_AUTH_ENABLED` and `DEMO_MODE` are true; those credentials remain in ignored `backend/.env` and must be disabled outside local demo use.

Firebase Auth uses in-memory persistence because the app session is stored separately in `sessionStorage`; this avoids IndexedDB cross-tab polling. App sessions are tab-scoped. Role portal layouts check for the matching role session and provide sign-out controls. These browser-side checks are navigation guards only: API endpoints that expose protected data still need server-side authentication/authorization before production use. The backend shares one Firebase Admin app with Firestore, requires a verified email claim, and returns a clear 503 if Admin credentials are not configured. A previously consumed Firebase action link can retry backend profile verification while the same user remains signed in in that tab. Local `backend/.env` uses the frontend's Firebase project ID; persistent Firestore use needs service account/ADC configuration. The Firebase token verifier reports certificate-fetch failures as 503 and logs safe exception classes for diagnosis.

Firebase client setup is in `frontend/lib/firebase.js`. Copy `frontend/.env.firebase.example` to `frontend/.env.local` and fill in the Firebase web app values. In Firebase Console enable Email/Password and Email link sign-in, and authorize `localhost` plus the deployed app domain. `OtpVerification.jsx` and `ForgotPasswordFlow.jsx` are legacy demo components and are not used by these login/signup forms.

The backend profile endpoint is intended to verify Firebase ID tokens before creating or retrieving role-specific profiles. Do not treat the current `sessionStorage` value alone as proof of backend authentication.

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
   - Fires toasts for user interactions: tab switching, captcha refresh/readout, OTP delivery, resend triggers, clipboard paste, login success, SSO launch, and demo pre-fill.
The toast bus remains mounted in `frontend/app/layout.js` and reports auth errors, email-link send status, and form feedback.

---

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
- Candidate Portal: `http://localhost:3000/candidate`
- Candidate Interview Room: `http://localhost:3000/candidate/interview`
- HR Dashboard: `http://localhost:3000/dashboard`
- Candidate Profile: `http://localhost:3000/dashboard/candidates/cand-sarah-001`
- Live HR Interview Monitor: `http://localhost:3000/dashboard/candidates/cand-sarah-001/interview`

---

## 8. Testing & Verification Status

- **Frontend Compilation**: Verified with `next build` (Next.js 16.4.6 with Turbopack). All routes compile statically/dynamically with **0 errors**.
- **Backend Test Suite**: Tested with `python run_full_verification.py`. All 11 test assertions passed (CRUD, calculations, AI fallbacks, interview telemetry, and document parsing).
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

### D. Firebase Integration & Persistence
- Integrated `firebase-admin` and `DatabaseManager` to switch between `MockDB` (demo mode) and `FirebaseDB` (production mode).
### E. Firebase Integration & Persistence
- **Implemented Firestore Backend**: Fully integrated `firebase-admin` into the backend. 
- **Dynamic Database Switching**: Introduced `DatabaseManager` in `backend/app/db/manager.py`. When `DEMO_MODE=False` is set in `.env`, the system automatically routes all CRUD operations to live Firestore collections instead of in-memory dictionaries.
- **Seeding Support**: The `seed_demo_data()` function now supports pushing demo candidates directly to Firebase on the first run of a new environment.

### F. Firebase Email-Link Authentication
- The requested sign-in experience is a Firebase email sign-in link. Login/signup pages show an inbox notice and resend action; numeric codes are no longer used for those flows.
- Added the Firebase Web SDK (`firebase` dependency) to `frontend/package.json`, `package-lock.json`, and `pnpm-lock.yaml`.
- Added `frontend/lib/firebase.js`, `frontend/components/auth/EmailLinkNotice.jsx`, and `frontend/app/auth/email-link/page.jsx`. The callback completes `signInWithEmailLink`, writes a role-specific session to `sessionStorage`, then redirects to the Candidate or HR area.
- Added `frontend/.env.firebase.example`. Copy it to `frontend/.env.local`, fill the Firebase web app config, enable Email/Password plus Email link sign-in in Firebase Console, and authorize `localhost` and the deployed domain.
- Candidate and HR login/signup support both Firebase email/password and email-link sign-in. Password signup requires matching passwords and email verification; existing email-link accounts can set a password after verifying their email. Both paths send Firebase ID tokens to `/api/auth/verify-token` before a role session is stored. Candidate forms retain CAPTCHA checks. The callback permits retrying backend profile verification after the one-time Firebase link was consumed, provided the same user remains signed in. Role layouts check the matching tab session and provide sign-out actions; server-side authorization is still required for protected APIs.
- Backend Firebase Admin credentials/project setup is required to verify ID tokens. The Gmail App Password discussed earlier is not used by this Firebase flow; revoke it if it was a real credential.
- `ForgotPasswordFlow` remains available elsewhere in the project as a standalone demo component, but it is no longer used on these passwordless sign-in pages.

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

---

## 10. Immediate Next Steps / Roadmap for Contributors

1. **Connect Live Whisper Backend**: Connect `POST /api/interviews/{sessionId}/audio` to a local `faster-whisper` instance.
2. **Connect Live Gemma 4 Model**: Configure `GEMMA_API_BASE_URL` in `backend/.env` targeting local Ollama (`ollama run gemma:7b`).
3. **WebRTC Video Signaling**: Replace simulated WebRTC tile feeds with live peer-to-peer signaling using Simple-Peer or LiveKit.
4. **Configure Firebase**: Set `FIREBASE_CREDENTIALS_PATH` and `FIREBASE_PROJECT_ID` in `backend/.env` to persist sessions.
If you are picking up work on this project, consider these high-leverage enhancements:
1. **Configure Firebase**: Fill `frontend/.env.local` from `frontend/.env.firebase.example`; enable Email/Password and Email link sign-in; authorize local and production domains; set backend `FIREBASE_CREDENTIALS_PATH` and/or `FIREBASE_PROJECT_ID` for token verification and Firestore persistence. These credentials were not available in this workspace, so real email delivery and production token verification still depend on Firebase setup.
3. **Real Gemma 4 Connection**: Configure `GEMMA_API_KEY` and `GEMMA_API_BASE_URL` in `backend/.env` to connect to a live Ollama or Vertex AI instance instead of demo mock responses.
4. **Real WebRTC / Camera Feed**: Enhance `frontend/app/dashboard/candidates/[id]/interview/page.jsx` with real face-mesh or face-api.js detection for multi-face detection.
5. **PDF Report Export**: Wire up client-side PDF export (e.g., using `jspdf` or `html2canvas`) on `/dashboard/reports` and candidate profiles.
