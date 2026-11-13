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
5. **Dual-Portal Card Authentication System**: Role-segregated entry points for Candidates and HR/Recruiters, backed by anti-bot visual CAPTCHAs, 6-digit OTP verification, password reset workflows, and reactive hot toast telemetry.

---

## 2. Technology Stack & Key Decisions

| Layer | Technologies Used | Key Architectural Decision |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React | Single-page and dashboard components built in `.jsx` for rapid iteration. Uses Tailwind CSS compiled into `app/tailwind.css`. Global `<Toaster />` mounted in root `layout.js` for reactive event notifications. |
| **Authentication & Security** | Canvas API, SpeechSynthesis, Pub/Sub Toast Event Bus | Client-side dual authentication suite (Candidate & HR). Implements canvas distortion security CAPTCHAs with audio synthesis for candidates, 6-digit auto-advancing OTP boxes with resend countdowns, and 3-step password recovery. |
| **Interview & Proctoring** | MediaRecorder API, HTML5 Canvas, FaceDetector API, WebRTC / WebM | Dedicated role-separated interview engine. Canvas-based eye gaze estimator with pupil/face centering heuristics and attention scoring. Dual-tile video architecture for candidate and interviewer feeds. |
| **Speech-to-Text & AI Detection** | Local Whisper, Ollama + Gemma 4, LangChain | Voice recording via MediaRecorder (WebM/Opus) transcribing into text. Spoken answers analyzed via AI response detector (0–100% LLM score based on vocabulary complexity, filler density, and syntactic uniformity). |
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
   - Fires toasts for user interactions: tab switching, captcha refresh/readout, OTP delivery, resend triggers, clipboard paste, login success, SSO launch, and demo pre-fill.

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

### C. Cleaned HR Top Navigation & Security Gate
- Removed redundant public links from HR top bar. Gated all candidate dossiers and trust records behind authenticated sessions.

### D. Firebase Integration & Persistence
- Integrated `firebase-admin` and `DatabaseManager` to switch between `MockDB` (demo mode) and `FirebaseDB` (production mode).

---

## 10. Immediate Next Steps / Roadmap for Contributors

1. **Connect Live Whisper Backend**: Connect `POST /api/interviews/{sessionId}/audio` to a local `faster-whisper` instance.
2. **Connect Live Gemma 4 Model**: Configure `GEMMA_API_BASE_URL` in `backend/.env` targeting local Ollama (`ollama run gemma:7b`).
3. **WebRTC Video Signaling**: Replace simulated WebRTC tile feeds with live peer-to-peer signaling using Simple-Peer or LiveKit.
4. **Configure Firebase**: Set `FIREBASE_CREDENTIALS_PATH` and `FIREBASE_PROJECT_ID` in `backend/.env` to persist sessions.
