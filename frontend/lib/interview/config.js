// Interview API Configuration
// Backend integration point: set NEXT_PUBLIC_API_BASE_URL in .env.local
export const INTERVIEW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const INTERVIEW_CONFIG = {
  // Audio recording & Whisper integration
  maxRecordingSeconds: 180,
  silenceTimeoutMs: 3000,
  audioMimeType: 'audio/webm;codecs=opus',

  // AI detection thresholds
  aiDetectionThresholds: {
    natural: 30,     // < 30 = Natural speech
    review: 65,      // 30-65 = Review needed
    // > 65 = Likely AI-generated (ChatGPT / Claude / Copilot)
  },

  // Gaze tracking
  gazeAwayThresholdMs: 3000,  // flag after 3s eyes off camera

  // Integrity monitoring
  tabSwitchWarningCount: 3,
  tabSwitchCriticalCount: 7,
};

// Backend API endpoint map — connectable to FastAPI, Whisper, Gemma & LangChain
export const INTERVIEW_ENDPOINTS = {
  // Session lifecycle
  createSession:        (candidateId) => `/api/interviews/sessions?candidate_id=${encodeURIComponent(candidateId)}`,
  getSession:           (sessionId)   => `/api/interviews/${encodeURIComponent(sessionId)}`,
  dispatchQuestion:     (sessionId)   => `/api/interviews/${encodeURIComponent(sessionId)}/question`,
  questionQueue:        (sessionId)   => `/api/interviews/${encodeURIComponent(sessionId)}/questions/queue`,
  updateGaze:           (sessionId)   => `/api/interviews/${encodeURIComponent(sessionId)}/gaze`,
  completeSession:      (sessionId)   => `/api/interviews/${sessionId}/complete`,
  getReport:            (sessionId)   => `/api/interviews/${sessionId}/report`,

  // Background integrity proctoring
  recordEvent:          (sessionId)   => `/api/interviews/${sessionId}/events`,
  uploadCameraFrame:    (sessionId)   => `/api/interviews/${sessionId}/camera-frame`,

  // Whisper speech-to-text transcription
  uploadAudio:          (sessionId)   => `/api/interviews/${sessionId}/audio`,
  transcribe:           (sessionId)   => `/api/interviews/${sessionId}/transcribe`,
  whisperStream:        (sessionId)   => `/api/interviews/${sessionId}/whisper/stream`,

  // Candidate answer submission & AI speech detection
  submitAnswer:         (sessionId)   => `/api/interviews/${sessionId}/answers`,
  analyzeResponse:      (sessionId)   => `/api/interviews/${sessionId}/analyze-response`,

  // Gemma / LangChain question generation
  generateQuestion:     (sessionId)   => `/api/interviews/${sessionId}/questions/generate`,
  questionsFromResume:  (sessionId)   => `/api/interviews/${sessionId}/questions/from-resume`,
  gemmaFollowUp:        (sessionId)   => `/api/interviews/${sessionId}/gemma/follow-up`,

  // WebRTC video feeds (Candidate & HR Camera)
  webrtcSignal:         (sessionId)   => `/api/interviews/${sessionId}/webrtc/signal`,
};
