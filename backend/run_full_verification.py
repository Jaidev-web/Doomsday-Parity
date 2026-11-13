import sys
import os

sys.path.insert(0, ".")
os.environ["DEMO_MODE"] = "true"

def run_coro(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value

from app.demo.seed import seed_demo_data
from app.routers.candidates import list_candidates, get_candidate, create_candidate, CandidateCreate
from app.routers.credentials import get_credentials, verify_credentials
from app.routers.identity import get_identity, verify_identity
from app.routers.trust import calculate_trust, get_trust
from app.routers.interviews import create_interview, record_event, get_report
from app.models.interview import InterviewEvent
from app.routers.ai_assistant import ask_ai, AIQuestion
from app.services.trust_service import trust_service
from app.services.credential_service import credential_service
from app.services.identity_service import identity_service
from app.services.interview_service import interview_service
from app.services.document_service import document_service

def test_full_suite():
    print("=" * 60)
    print("TRUSTHIRE FULL BACKEND VERIFICATION SUITE")
    print("=" * 60)

    # 1. Seed demo candidates
    seed_demo_data()
    print("✓ Demo database seeded successfully")

    # 2. Test candidate listing
    cands = run_coro(list_candidates())
    assert len(cands) == 3, f"Expected 3 candidates, got {len(cands)}"
    print(f"✓ Candidates listed: {len(cands)} candidates verified")
    for c in cands:
        print(f"   - {c['name']} | Trust: {c['trust_score']} | Status: {c['overall_status']}")

    # 3. Test individual candidate profiles
    sarah = run_coro(get_candidate("cand-sarah-001"))
    marcus = run_coro(get_candidate("cand-marcus-002"))
    priya = run_coro(get_candidate("cand-priya-003"))
    assert sarah['name'] == "Sarah Chen"
    assert marcus['name'] == "Marcus Rivera"
    assert priya['name'] == "Priya Sharma"
    print("✓ All 3 demo candidates retrieved and validated")

    # 4. Test credential checks
    creds_marcus = run_coro(get_credentials("cand-marcus-002"))
    assert len(creds_marcus['results']) > 0
    print(f"✓ Credential checks for Marcus Rivera: {len(creds_marcus['results'])} findings recorded")
    for item in creds_marcus['results']:
        print(f"   * [{item['severity'].upper()}] {item['title']} -> {item['status']}")

    # 5. Test identity checks
    idents_marcus = run_coro(get_identity("cand-marcus-002"))
    assert len(idents_marcus['results']) > 0
    print(f"✓ Identity checks for Marcus Rivera: {len(idents_marcus['results'])} findings recorded")

    # 6. Test PAN verification simulation
    pan_result = identity_service.verify_pan("ABCDE1234F")
    assert pan_result["status"] == "verified"
    print(f"✓ Simulated PAN verification: {pan_result['pan']} ({pan_result['status']})")

    # 7. Test Trust Score calculation engine
    trust_calc = run_coro(calculate_trust("cand-marcus-002"))
    assert trust_calc["trust_score"] < 50
    assert trust_calc["overall_status"] == "critical_review"
    print(f"✓ Trust score recalculation: Score = {trust_calc['trust_score']} ({trust_calc['overall_status']})")

    # 8. Test AI Assistant reasoning
    ai_resp = run_coro(ask_ai("cand-marcus-002", AIQuestion(
        question="Explain the certificate discrepancy on Marcus Rivera"
    )))
    assert "[Demo Mode]" in ai_resp["answer"] or len(ai_resp["answer"]) > 10
    print(f"✓ Gemma AI reasoning response: {ai_resp['answer'][:80]}...")

    # 9. Test Candidate Creation
    new_candidate = run_coro(create_candidate(CandidateCreate(
        name="Diana Prince",
        email="diana@amazon.com",
        position="Principal Security Researcher",
        phone="+1-555-0199"
    )))
    assert new_candidate["id"] is not None
    print(f"✓ Created new candidate: {new_candidate['name']} with ID: {new_candidate['id']}")

    # 10. Test Interview session & integrity monitoring
    session = run_coro(create_interview(new_candidate["id"], total_questions=5))
    session_id = session["id"]

    # Record tab switches and pastes
    run_coro(record_event(session_id, InterviewEvent(
        event_type="tab_switch",
        timestamp="2026-11-13T10:05:00Z",
        details={"away_duration_sec": 30}
    )))
    run_coro(record_event(session_id, InterviewEvent(
        event_type="copy_paste",
        timestamp="2026-11-13T10:05:31Z",
        details={"length": 210}
    )))

    report = run_coro(get_report(session_id))
    assert report["tab_switches"] == 1
    assert report["copy_paste_count"] == 1
    print(f"✓ Interview telemetry audit report: Score = {report['integrity_score']}, Switches = {report['tab_switches']}")

    # 11. Document service text extraction
    text_sample = b"Candidate Resume\nSkills: Python, React, Next.js, FastAPI"
    extracted = document_service.extract_text(text_sample, "text/plain")
    assert "FastAPI" in extracted
    print(f"✓ Document parsing test passed: '{extracted[:35]}...'")

    print("=" * 60)
    print("ALL 11 BACKEND MODULE & SERVICE TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_suite()
