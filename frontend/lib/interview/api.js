// Interview API client — all backend integration points are here
// When backend is ready, mock fallbacks will be bypassed automatically

import { INTERVIEW_API_BASE, INTERVIEW_ENDPOINTS } from './config';
import { MOCK_RESUME_DATA } from './mockData';

async function interviewFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${INTERVIEW_API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[InterviewAPI] ${endpoint} failed:`, err.message, '— using mock');
    return null;
  }
}

async function strictInterviewFetch(endpoint, options = {}) {
  const res = await fetch(`${INTERVIEW_API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function createInterviewSession(candidateId) {
  // BACKEND INTEGRATION: POST /api/interviews/sessions?candidate_id={id}
  // Returns: { session_id, candidate_id, started_at, status }
  return strictInterviewFetch(INTERVIEW_ENDPOINTS.createSession(candidateId), { method: 'POST' });
}

export function getInterviewSession(sessionId) {
  return strictInterviewFetch(INTERVIEW_ENDPOINTS.getSession(sessionId));
}

export function dispatchInterviewQuestion(sessionId, question) {
  return strictInterviewFetch(INTERVIEW_ENDPOINTS.dispatchQuestion(sessionId), {
    method: 'POST',
    body: JSON.stringify(question),
  });
}

export function saveInterviewQuestionQueue(sessionId, questions) {
  return strictInterviewFetch(INTERVIEW_ENDPOINTS.questionQueue(sessionId), {
    method: 'PUT',
    body: JSON.stringify({ questions }),
  });
}

export function updateInterviewGaze(sessionId, gaze) {
  return strictInterviewFetch(INTERVIEW_ENDPOINTS.updateGaze(sessionId), {
    method: 'POST',
    body: JSON.stringify(gaze),
  });
}

export function submitInterviewAnswer(sessionId, answer) {
  return strictInterviewFetch(INTERVIEW_ENDPOINTS.submitAnswer(sessionId), {
    method: 'POST',
    body: JSON.stringify(answer),
  });
}

export async function completeInterviewSession(sessionId, summary) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/complete
  // Body: { summary, integrity_score, qa_count }
  return interviewFetch(INTERVIEW_ENDPOINTS.completeSession(sessionId), {
    method: 'POST',
    body: JSON.stringify(summary),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUME / DOCUMENT SCANNING
// ─────────────────────────────────────────────────────────────────────────────

export async function getResumeData(candidateId) {
  // BACKEND INTEGRATION: GET /api/candidates/{candidateId}/documents?type=resume
  // Returns parsed resume: { skills, experience, projects, certifications }
  const data = await interviewFetch(`/api/candidates/${candidateId}/documents?type=resume`);
  if (data) return data;
  return MOCK_RESUME_DATA[candidateId] || MOCK_RESUME_DATA['cand-sarah-001'];
}

export async function generateQuestionsFromResume(sessionId, { skill, project, context }) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/questions/from-resume
  // Body: { skill, project, context }
  // Returns: [{ question_id, question_text, difficulty, category }]
  const data = await strictInterviewFetch(INTERVIEW_ENDPOINTS.questionsFromResume(sessionId), {
    method: 'POST',
    body: JSON.stringify({ skill, project, context }),
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE / TRANSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadAudioForTranscription(sessionId, audioBlob, questionId) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/audio
  // Body: FormData { audio: Blob, question_id: string }
  // Returns: { transcript_id, transcript_text, duration_seconds }
  try {
    const formData = new FormData();
    const ext = audioBlob.type?.includes('mp4') ? 'mp4' : audioBlob.type?.includes('ogg') ? 'ogg' : 'webm';
    formData.append('audio', audioBlob, `response.${ext}`);
    formData.append('question_id', questionId || '');

    const res = await fetch(`${INTERVIEW_API_BASE}${INTERVIEW_ENDPOINTS.uploadAudio(sessionId)}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let detail = `Audio transcription failed (${res.status})`;
      try { detail = (await res.json()).detail || detail; } catch {}
      throw new Error(detail);
    }
    return await res.json();
  } catch (err) {
    console.error('[InterviewAPI] Audio upload failed:', err.message);
    throw err;
  }
}

export async function transcribeAudio(sessionId, transcriptId) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/transcribe
  // Uses local Whisper model on backend
  // Returns: { transcript_text, confidence, language }
  const data = await interviewFetch(INTERVIEW_ENDPOINTS.transcribe(sessionId), {
    method: 'POST',
    body: JSON.stringify({ transcript_id: transcriptId }),
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export async function analyzeResponseForAI(sessionId, { transcript, questionId }) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/analyze-response
  // Body: { transcript, question_id }
  // Returns: { ai_score (0-100), signals: { vocabulary_complexity, sentence_uniformity, ... }, verdict }
  return strictInterviewFetch(INTERVIEW_ENDPOINTS.analyzeResponse(sessionId), {
    method: 'POST',
    body: JSON.stringify({ transcript, question_id: questionId, question: 'General interview question' }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRITY EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function recordIntegrityEvent(sessionId, event) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/events
  // Body: { event_type, severity, timestamp, metadata }
  return interviewFetch(INTERVIEW_ENDPOINTS.recordEvent(sessionId), {
    method: 'POST',
    body: JSON.stringify({
      event_type: event.event_type || event.eventType,
      timestamp: event.timestamp,
      details: event.details || event.metadata || null,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA FRAME ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadCameraFrame(sessionId, imageDataUrl) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/camera-frame
  // Body: FormData { frame: Blob }
  // Returns: { gaze_direction, face_detected, attention_score }
  try {
    const res = await fetch(imageDataUrl);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append('frame', blob, 'frame.jpg');

    const apiRes = await fetch(
      `${INTERVIEW_API_BASE}${INTERVIEW_ENDPOINTS.uploadCameraFrame(sessionId)}`,
      { method: 'POST', body: formData }
    );
    if (!apiRes.ok) throw new Error(`HTTP ${apiRes.status}`);
    return await apiRes.json();
  } catch {
    return null;
  }
}

