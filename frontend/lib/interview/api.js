// Interview API client — all backend integration points are here
// When backend is ready, mock fallbacks will be bypassed automatically

import { INTERVIEW_API_BASE, INTERVIEW_ENDPOINTS } from './config';
import { MOCK_RESUME_DATA, RESUME_QUESTION_TEMPLATES, GENERIC_QUESTIONS } from './mockData';

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

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function createInterviewSession(candidateId) {
  // BACKEND INTEGRATION: POST /api/interviews/sessions?candidate_id={id}
  // Returns: { session_id, candidate_id, started_at, status }
  const data = await interviewFetch(INTERVIEW_ENDPOINTS.createSession(candidateId), { method: 'POST' });
  if (data) return data;

  return {
    session_id: `session-${candidateId}-${Date.now()}`,
    candidate_id: candidateId,
    started_at: new Date().toISOString(),
    status: 'active',
  };
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
  const data = await interviewFetch(INTERVIEW_ENDPOINTS.questionsFromResume(sessionId), {
    method: 'POST',
    body: JSON.stringify({ skill, project, context }),
  });
  if (data) return data;

  // Mock: pick from templates or generic
  const templates = RESUME_QUESTION_TEMPLATES[skill] || GENERIC_QUESTIONS;
  const q = templates[Math.floor(Math.random() * templates.length)];
  return [{ question_id: `q-${Date.now()}`, question_text: q, difficulty: 'medium', category: skill || 'general' }];
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
    formData.append('audio', audioBlob, 'response.webm');
    formData.append('question_id', questionId || '');

    const res = await fetch(`${INTERVIEW_API_BASE}${INTERVIEW_ENDPOINTS.uploadAudio(sessionId)}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[InterviewAPI] Audio upload failed:', err.message, '— using mock');
    return null;
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
  const data = await interviewFetch(INTERVIEW_ENDPOINTS.analyzeResponse(sessionId), {
    method: 'POST',
    body: JSON.stringify({ transcript, question_id: questionId }),
  });
  if (data) return data;

  // Frontend heuristic mock — NOT real AI detection
  const wordCount = transcript ? transcript.split(' ').length : 0;
  const avgWordLength = transcript
    ? transcript.split(' ').reduce((a, w) => a + w.length, 0) / wordCount
    : 0;
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'kind of'];
  const fillerCount = fillerWords.filter((w) => transcript?.toLowerCase().includes(w)).length;
  const sentences = transcript ? transcript.split(/[.!?]+/).filter(Boolean) : [];
  const avgSentenceLen = sentences.length ? wordCount / sentences.length : 0;

  // Simple heuristic score — longer words, uniform sentences, no fillers → higher AI probability
  let score = 0;
  if (avgWordLength > 6) score += 25;
  if (fillerCount === 0) score += 25;
  if (avgSentenceLen > 20) score += 20;
  if (wordCount < 30) score -= 15;
  score = Math.max(5, Math.min(95, score + Math.floor(Math.random() * 15)));

  return {
    ai_score: score,
    signals: {
      vocabulary_complexity: avgWordLength > 6 ? 'high' : 'normal',
      sentence_uniformity: avgSentenceLen > 20 ? 'uniform' : 'varied',
      filler_word_density: fillerCount === 0 ? 'absent' : `${fillerCount} detected`,
      pause_patterns: 'unavailable (audio needed)',
      hedging_language: transcript?.toLowerCase().includes('i think') || transcript?.toLowerCase().includes('i believe') ? 'present' : 'absent',
      personal_anecdotes: score < 40 ? 'detected' : 'not detected',
    },
    verdict: score < 30 ? 'natural' : score < 65 ? 'review' : 'likely_ai',
    note: 'Frontend heuristics only — connect backend for Whisper + LLM analysis',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRITY EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function recordIntegrityEvent(sessionId, event) {
  // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/events
  // Body: { event_type, severity, timestamp, metadata }
  return interviewFetch(INTERVIEW_ENDPOINTS.recordEvent(sessionId), {
    method: 'POST',
    body: JSON.stringify(event),
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

