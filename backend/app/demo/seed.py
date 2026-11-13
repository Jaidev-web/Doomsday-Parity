from datetime import datetime, timedelta
from app.db import db


def seed_demo_data():
    """Seed the mock database with 3 demo candidates and their verification data."""

    if db.list("candidates"):
        return  # Already seeded

    now = datetime.utcnow()

    # ── Candidate 1: Sarah Chen ──────────────────────────────────────
    sarah_id = "cand-sarah-001"
    db.add("candidates", {
        "id": sarah_id,
        "name": "Sarah Chen",
        "email": "sarah.chen@email.com",
        "phone": "+1-555-0101",
        "position": "Senior Frontend Engineer",
        "linkedin_url": "https://linkedin.com/in/sarahchen",
        "github_url": "https://github.com/sarahchen",
        "avatar_url": None,
        "trust_score": 87.0,
        "overall_status": "verified",
        "credential_status": "verified",
        "identity_status": "verified",
        "interview_status": "passed",
        "created_at": (now - timedelta(days=5)).isoformat(),
        "updated_at": now.isoformat(),
    })

    # Sarah's verifications – mostly clean
    for v in [
        {
            "id": "ver-sarah-01", "candidate_id": sarah_id, "module": "credential",
            "check_type": "employment_dates", "status": "passed", "severity": "low",
            "title": "Employment dates verified",
            "explanation": "All employment dates match LinkedIn profile and references.",
            "evidence": ["Resume dates match LinkedIn", "Reference confirmed tenure"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-sarah-02", "candidate_id": sarah_id, "module": "credential",
            "check_type": "cert_metadata", "status": "passed", "severity": "low",
            "title": "Certificate metadata valid",
            "explanation": "AWS Solutions Architect certificate metadata and verification link are valid.",
            "evidence": ["Certificate ID verified", "Issue date matches resume"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-sarah-03", "candidate_id": sarah_id, "module": "credential",
            "check_type": "github_analysis", "status": "passed", "severity": "low",
            "title": "GitHub profile consistent",
            "explanation": "Active contributions since 2019, consistent with claimed 5+ years experience.",
            "evidence": ["842 contributions last year", "Account created 2019"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-sarah-04", "candidate_id": sarah_id, "module": "identity",
            "check_type": "name_consistency", "status": "passed", "severity": "low",
            "title": "Name consistent across documents",
            "explanation": "Name matches across resume, ID, and LinkedIn.",
            "evidence": ["Resume: Sarah Chen", "ID: Sarah Chen", "LinkedIn: Sarah Chen"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-sarah-05", "candidate_id": sarah_id, "module": "identity",
            "check_type": "document_info", "status": "passed", "severity": "low",
            "title": "ID document verified",
            "explanation": "Government-issued ID is valid and not expired.",
            "evidence": ["Passport valid until 2029"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-sarah-06", "candidate_id": sarah_id, "module": "interview",
            "check_type": "browser_integrity", "status": "passed", "severity": "low",
            "title": "Interview integrity clean",
            "explanation": "No suspicious browser activity detected during interview.",
            "evidence": ["0 tab switches", "0 copy-paste events"],
            "timestamp": now.isoformat(),
        },
    ]:
        db.add("verifications", v)

    # Sarah's interview session
    sarah_session_id = "int-sarah-001"
    db.add("interviews", {
        "id": sarah_session_id,
        "candidate_id": sarah_id,
        "started_at": (now - timedelta(hours=2)).isoformat(),
        "ended_at": (now - timedelta(hours=1)).isoformat(),
        "status": "completed",
        "events": [],
        "total_questions": 5,
        "answered_questions": 5,
    })

    # Sarah's AI history
    db.add("ai_history", {
        "id": f"ai-{sarah_id}",
        "candidate_id": sarah_id,
        "conversations": [
            {
                "id": "ai-resp-sarah-01",
                "candidate_id": sarah_id,
                "question": "Summarize trust assessment for Sarah Chen",
                "answer": "[Demo Mode] Sarah Chen shows a high trust profile (87/100). All credentials verified, employment dates confirmed, and clean interview session with zero suspicious events.",
                "model_used": "demo",
                "timestamp": now.isoformat(),
            }
        ],
    })

    # ── Candidate 2: Marcus Rivera ───────────────────────────────────
    marcus_id = "cand-marcus-002"
    db.add("candidates", {
        "id": marcus_id,
        "name": "Marcus Rivera",
        "email": "marcus.rivera@email.com",
        "phone": "+1-555-0202",
        "position": "Full Stack Developer",
        "linkedin_url": "https://linkedin.com/in/marcusrivera",
        "github_url": "https://github.com/marcusrivera",
        "avatar_url": None,
        "trust_score": 42.0,
        "overall_status": "critical_review",
        "credential_status": "failed",
        "identity_status": "warning",
        "interview_status": "flagged",
        "created_at": (now - timedelta(days=3)).isoformat(),
        "updated_at": now.isoformat(),
    })

    for v in [
        {
            "id": "ver-marcus-01", "candidate_id": marcus_id, "module": "credential",
            "check_type": "employment_dates", "status": "failed", "severity": "critical",
            "title": "Employment date conflict detected",
            "explanation": "Resume claims Senior Dev at TechCorp (2020-2023), but LinkedIn shows Junior Dev (2021-2022). 1-year overlap with another listed employer.",
            "evidence": [
                "Resume: TechCorp Senior Dev 2020-2023",
                "LinkedIn: TechCorp Junior Dev 2021-2022",
                "Overlap with DataFlow Inc (2020-2021)",
            ],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-marcus-02", "candidate_id": marcus_id, "module": "credential",
            "check_type": "cert_metadata", "status": "failed", "severity": "high",
            "title": "Certificate metadata mismatch",
            "explanation": "Google Cloud Professional certificate PDF metadata shows creation date after claimed issue date. Document author field is 'Template User'.",
            "evidence": [
                "Claimed issue: Jan 2022",
                "PDF created: Mar 2024",
                "Author: Template User",
            ],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-marcus-03", "candidate_id": marcus_id, "module": "credential",
            "check_type": "github_analysis", "status": "warning", "severity": "high",
            "title": "Recently created GitHub account",
            "explanation": "GitHub account created 2 months ago despite claiming 4+ years of open-source contributions. Only 12 commits, mostly README updates.",
            "evidence": [
                "Account age: 2 months",
                "Total commits: 12",
                "Mostly README.md changes",
                "No original repositories",
            ],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-marcus-04", "candidate_id": marcus_id, "module": "identity",
            "check_type": "name_consistency", "status": "warning", "severity": "medium",
            "title": "Minor name discrepancy",
            "explanation": "Resume says 'Marcus J. Rivera' but LinkedIn uses 'Marcus Rivera'. Minor but noted.",
            "evidence": ["Resume: Marcus J. Rivera", "LinkedIn: Marcus Rivera"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-marcus-05", "candidate_id": marcus_id, "module": "interview",
            "check_type": "browser_integrity", "status": "failed", "severity": "critical",
            "title": "Excessive tab switching during interview",
            "explanation": "7 tab switches detected during technical interview. Multiple copy-paste events correlated with tab switches.",
            "evidence": [
                "7 tab switches",
                "4 copy-paste events after tab returns",
                "Average away time: 45 seconds",
            ],
            "timestamp": now.isoformat(),
        },
    ]:
        db.add("verifications", v)

    marcus_session_id = "int-marcus-002"
    db.add("interviews", {
        "id": marcus_session_id,
        "candidate_id": marcus_id,
        "started_at": (now - timedelta(hours=4)).isoformat(),
        "ended_at": (now - timedelta(hours=3)).isoformat(),
        "status": "flagged",
        "events": [
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=3, minutes=50)).isoformat(), "details": {"away_duration_sec": 38}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=3, minutes=45)).isoformat(), "details": {"away_duration_sec": 52}},
            {"event_type": "copy_paste", "timestamp": (now - timedelta(hours=3, minutes=44)).isoformat(), "details": {"length": 240}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=3, minutes=40)).isoformat(), "details": {"away_duration_sec": 41}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=3, minutes=35)).isoformat(), "details": {"away_duration_sec": 55}},
            {"event_type": "copy_paste", "timestamp": (now - timedelta(hours=3, minutes=34)).isoformat(), "details": {"length": 180}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=3, minutes=28)).isoformat(), "details": {"away_duration_sec": 33}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=3, minutes=22)).isoformat(), "details": {"away_duration_sec": 60}},
            {"event_type": "copy_paste", "timestamp": (now - timedelta(hours=3, minutes=21)).isoformat(), "details": {"length": 310}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=3, minutes=15)).isoformat(), "details": {"away_duration_sec": 47}},
            {"event_type": "copy_paste", "timestamp": (now - timedelta(hours=3, minutes=14)).isoformat(), "details": {"length": 150}},
        ],
        "total_questions": 5,
        "answered_questions": 5,
    })

    db.add("ai_history", {
        "id": f"ai-{marcus_id}",
        "candidate_id": marcus_id,
        "conversations": [
            {
                "id": "ai-resp-marcus-01",
                "candidate_id": marcus_id,
                "question": "Summarize trust assessment for Marcus Rivera",
                "answer": "[Demo Mode] Marcus Rivera presents a critical-risk profile (42/100). Major red flags: employment date conflicts between resume and LinkedIn, certificate PDF metadata indicates possible forgery (created 2 years after claimed issue date), GitHub account is only 2 months old contradicting claimed experience, and 7 tab switches during interview suggest external assistance.",
                "model_used": "demo",
                "timestamp": now.isoformat(),
            }
        ],
    })

    # ── Candidate 3: Priya Sharma ────────────────────────────────────
    priya_id = "cand-priya-003"
    db.add("candidates", {
        "id": priya_id,
        "name": "Priya Sharma",
        "email": "priya.sharma@email.com",
        "phone": "+91-98765-43210",
        "position": "Backend Engineer",
        "linkedin_url": "https://linkedin.com/in/priyasharma",
        "github_url": "https://github.com/priyasharma-dev",
        "avatar_url": None,
        "trust_score": 64.0,
        "overall_status": "needs_review",
        "credential_status": "warning",
        "identity_status": "verified",
        "interview_status": "warning",
        "created_at": (now - timedelta(days=2)).isoformat(),
        "updated_at": now.isoformat(),
    })

    for v in [
        {
            "id": "ver-priya-01", "candidate_id": priya_id, "module": "credential",
            "check_type": "employment_dates", "status": "passed", "severity": "low",
            "title": "Employment dates consistent",
            "explanation": "Employment history matches across resume and LinkedIn with no gaps or overlaps.",
            "evidence": ["Resume matches LinkedIn timeline"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-priya-02", "candidate_id": priya_id, "module": "credential",
            "check_type": "cert_metadata", "status": "warning", "severity": "medium",
            "title": "Expired certificate verification link",
            "explanation": "Azure Fundamentals certificate verification URL returns 404. Certificate may have expired or link is outdated.",
            "evidence": [
                "Verification URL: 404 Not Found",
                "Certificate claimed: 2021",
                "Unable to independently verify",
            ],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-priya-03", "candidate_id": priya_id, "module": "credential",
            "check_type": "github_analysis", "status": "passed", "severity": "low",
            "title": "GitHub profile active and consistent",
            "explanation": "Account active since 2020 with regular contributions matching claimed experience.",
            "evidence": ["Account age: 4 years", "320 contributions last year", "Original projects present"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-priya-04", "candidate_id": priya_id, "module": "identity",
            "check_type": "name_consistency", "status": "passed", "severity": "low",
            "title": "Name consistent across platforms",
            "explanation": "Name matches across all submitted documents and online profiles.",
            "evidence": ["Resume: Priya Sharma", "LinkedIn: Priya Sharma", "GitHub: priyasharma-dev"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-priya-05", "candidate_id": priya_id, "module": "identity",
            "check_type": "pan_verification", "status": "passed", "severity": "low",
            "title": "PAN verification passed",
            "explanation": "PAN card details match submitted information (simulated verification).",
            "evidence": ["PAN format valid", "Name matches"],
            "timestamp": now.isoformat(),
        },
        {
            "id": "ver-priya-06", "candidate_id": priya_id, "module": "interview",
            "check_type": "browser_integrity", "status": "warning", "severity": "medium",
            "title": "Some tab switches during interview",
            "explanation": "3 tab switches detected. Below critical threshold but noted for review.",
            "evidence": [
                "3 tab switches",
                "1 copy-paste event",
                "Average away time: 15 seconds",
            ],
            "timestamp": now.isoformat(),
        },
    ]:
        db.add("verifications", v)

    priya_session_id = "int-priya-003"
    db.add("interviews", {
        "id": priya_session_id,
        "candidate_id": priya_id,
        "started_at": (now - timedelta(hours=6)).isoformat(),
        "ended_at": (now - timedelta(hours=5)).isoformat(),
        "status": "completed",
        "events": [
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=5, minutes=40)).isoformat(), "details": {"away_duration_sec": 12}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=5, minutes=25)).isoformat(), "details": {"away_duration_sec": 18}},
            {"event_type": "tab_switch", "timestamp": (now - timedelta(hours=5, minutes=10)).isoformat(), "details": {"away_duration_sec": 14}},
            {"event_type": "copy_paste", "timestamp": (now - timedelta(hours=5, minutes=9)).isoformat(), "details": {"length": 45}},
        ],
        "total_questions": 5,
        "answered_questions": 5,
    })

    db.add("ai_history", {
        "id": f"ai-{priya_id}",
        "candidate_id": priya_id,
        "conversations": [
            {
                "id": "ai-resp-priya-01",
                "candidate_id": priya_id,
                "question": "Summarize trust assessment for Priya Sharma",
                "answer": "[Demo Mode] Priya Sharma has a moderate trust score (64/100) requiring review. Credentials are mostly verified but one certificate link is expired/broken. Identity checks passed. Interview showed 3 tab switches — below critical threshold but above clean baseline. Recommend manual follow-up on the expired Azure certificate.",
                "model_used": "demo",
                "timestamp": now.isoformat(),
            }
        ],
    })
