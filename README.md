# TrustHire

**AI-Powered Candidate Verification & Fraud Detection Platform**

TrustHire is a comprehensive hiring integrity platform that uses AI to verify candidate credentials, detect identity inconsistencies, monitor interview behavior, and generate trust scores — helping recruiters make confident, data-driven hiring decisions.

---

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│                     │  HTTP   │                     │
│   Next.js 15 App    │◄───────►│   FastAPI Backend   │
│   (Port 3000)       │  REST   │   (Port 8000)       │
│                     │         │                     │
│  • Dashboard UI     │         │  • Candidate CRUD   │
│  • Trust Gauges     │         │  • Verification     │
│  • AI Chat Panel    │         │  • Trust Scoring    │
│  • Interview Views  │         │  • AI Service       │
│                     │         │  • Document Parser  │
└─────────────────────┘         └────────┬────────────┘
                                         │
                                ┌────────┼────────────┐
                                │        │            │
                           ┌────▼───┐ ┌──▼─────┐ ┌───▼──────┐
                           │Gemma 4 │ │Firebase│ │ In-Memory│
                           │  AI    │ │  (opt) │ │ Mock DB  │
                           └────────┘ └────────┘ └──────────┘
```

The frontend communicates with the backend via REST API calls. The backend orchestrates verification modules, AI analysis, and data storage. Firebase is optional — the app runs fully with an in-memory mock database and demo data out of the box.

---

## Features

### 🔍 Credential Verification
Analyze resumes, certificates, and employment history for discrepancies. Cross-reference dates, institutions, and metadata to surface inconsistencies.

### 🪪 Identity Checks
Verify candidate identity documents, check name consistency across platforms, validate PAN/ID numbers, and detect cross-platform inconsistencies.

### 📹 Interview Monitoring
Track browser behavior during interviews — tab switches, copy-paste events, window focus changes — and flag suspicious patterns with severity scoring.

### 📊 Trust Scoring
Rule-based composite trust score (0–100) combining credential verification (40%), identity checks (35%), and interview integrity (25%). Color-coded thresholds: High Trust (≥75), Needs Review (50–74), Critical (<50).

### 🤖 AI Assistant
Conversational AI powered by Gemma 4 that can analyze resumes, compare documents, explain discrepancies, generate interview questions, and summarize trust levels with cited evidence.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 15, React 19, Tailwind CSS  |
| Backend    | Python 3.13, FastAPI, Pydantic      |
| AI         | Gemma 4 (optional, mocked in demo)  |
| Storage    | Firebase (optional), In-Memory DB   |
| Documents  | PyPDF2, python-docx, Pillow         |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Python** 3.11+

### 1. Clone & Configure

```bash
git clone <repo-url> Doomsday-Parity
cd Doomsday-Parity
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.firebase.example frontend/.env.local
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Demo data (3 candidates) is seeded automatically on startup.

### 3. Start the Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

Open `http://localhost:3000` in your browser.

---

## Environment Variables

| Variable                   | Default                  | Description                                      |
|----------------------------|--------------------------|--------------------------------------------------|
| `NEXT_PUBLIC_API_URL`      | `http://localhost:8000`  | Backend API URL for the frontend                 |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | *(Firebase web app value)* | Firebase Authentication client configuration |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | *(Firebase web app value)* | Firebase Authentication client configuration |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | *(Firebase web app value)* | Firebase Authentication client configuration |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | *(Firebase web app value)* | Firebase Authentication client configuration |
| `DEMO_MODE`               | `true`                   | Enable demo mode with seeded data & mock AI      |
| `DEMO_AUTH_ENABLED` | `false` | Allow configured demo-account password sign-in; keep disabled outside local demos |
| `FIREBASE_CREDENTIALS_PATH` | *(empty)*              | Path to Firebase service account JSON            |
| `FIREBASE_PROJECT_ID` | *(empty)*              | Firebase project ID used by the backend Admin SDK |
| `FIREBASE_STORAGE_BUCKET`  | *(empty)*               | Firebase Storage bucket name                     |
| `GEMMA_API_KEY`            | *(empty)*                | API key for Gemma 4 AI service                   |
| `GEMMA_API_BASE_URL`       | *(empty)*                | Base URL for Gemma 4 API endpoint                |
| `GEMMA_MODEL`              | `gemma-4`                | Gemma model identifier                           |
Email sign-in links are sent by Firebase Authentication. Configure the Firebase web app in `frontend/.env.local`, enable Email/Password and Email link sign-in in Firebase Authentication, and add the app domain to Authorized domains. During local development, add `localhost` as an authorized domain. Firebase's Email Link sign-in requires Email/Password and Email Link providers enabled in the Firebase console.

The backend also needs Firebase Admin credentials to verify clicked sign-in links. Copy `backend/.env.example` to `backend/.env`, set `FIREBASE_PROJECT_ID` to the same project as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and set `FIREBASE_CREDENTIALS_PATH` to a Firebase service account JSON file. In Firebase Console, create a private key under **Project settings → Service accounts** and store it locally, for example as `backend/firebase-credentials.json` (this filename is ignored by git). With the documented `cd backend` startup command, set `FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json`. Never commit or share the service account JSON. SQL setup is not needed.

For local walkthroughs, the backend supports a password bypass for configured candidate and HR demo accounts. Set `DEMO_AUTH_ENABLED=true` and supply their credentials in `backend/.env`; it only authenticates these accounts while `DEMO_MODE=true`. The local credentials are stored in the ignored `backend/.env`. Keep this feature disabled in production.

---

## Demo Mode

When `DEMO_MODE=true` (the default), the app runs fully self-contained:

- **No external services required** — no Firebase, no AI API keys needed
- **3 pre-seeded demo candidates** with complete verification data
- **AI responses are mocked** with realistic `[Demo Mode]` labeled output
- **All verification modules return simulated results** so you can explore the full UI immediately

Simply start both servers and everything works out of the box.

---

## Project Structure

```
Doomsday-Parity/
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── README.md                 # This file
│
├── backend/                  # FastAPI backend
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Backend env template
│   └── app/
│       ├── main.py           # App entry point, CORS, router registration
│       ├── config.py         # Settings via pydantic-settings
│       ├── models/           # Pydantic data models
│       ├── db/               # Mock database & Firebase stub
│       ├── demo/             # Demo data seeding
│       ├── services/         # Business logic (AI, credentials, identity, etc.)
│       └── routers/          # API route handlers
│
└── frontend/                 # Next.js 15 frontend
    ├── package.json          # Node dependencies
    ├── tailwind.config.js    # Tailwind configuration
    └── app/                  # Next.js App Router
        ├── page.jsx          # Landing page
        ├── layout.jsx        # Root layout
        ├── globals.css       # Global styles
        └── dashboard/        # Dashboard pages
            ├── page.jsx      # Dashboard overview
            ├── layout.jsx    # Dashboard layout with sidebar
            └── candidates/   # Candidate views
```

---

## Demo Candidates

The app ships with 3 pre-configured demo candidates to showcase different trust scenarios:

| Candidate        | Trust Score | Status          | Highlights                                                                 |
|------------------|-------------|-----------------|----------------------------------------------------------------------------|
| **Sarah Chen**   | 87          | ✅ Mostly Verified | Clean record, credentials verified, minimal flags                         |
| **Marcus Rivera**| 42          | 🔴 Critical Review | Employment date conflicts, certificate metadata mismatch, 7 tab switches, recently created GitHub |
| **Priya Sharma** | 64          | 🟡 Needs Review    | Partially verified, expired certification link, 3 tab switches            |

---

## API Endpoints

| Method | Endpoint                                    | Description                    |
|--------|---------------------------------------------|--------------------------------|
| GET    | `/api/candidates`                           | List all candidates            |
| POST   | `/api/candidates`                           | Create a candidate             |
| GET    | `/api/candidates/{id}`                      | Get candidate details          |
| PUT    | `/api/candidates/{id}`                      | Update a candidate             |
| DELETE | `/api/candidates/{id}`                      | Delete a candidate             |
| POST   | `/api/candidates/{id}/documents`            | Upload document                |
| POST   | `/api/candidates/{id}/verify/credentials`   | Run credential verification    |
| POST   | `/api/candidates/{id}/verify/identity`      | Run identity verification      |
| POST   | `/api/candidates/{id}/trust/calculate`      | Calculate trust score          |
| GET    | `/api/candidates/{id}/trust`                | Get trust breakdown            |
| POST   | `/api/candidates/{id}/ai/ask`               | Ask AI assistant               |
| GET    | `/api/candidates/{id}/ai/history`           | Get AI chat history            |
| POST   | `/api/interviews`                           | Create interview session       |
| POST   | `/api/interviews/{id}/events`               | Record interview event         |
| POST   | `/api/interviews/{id}/analyze`              | Analyze interview integrity    |

---

## License

MIT
