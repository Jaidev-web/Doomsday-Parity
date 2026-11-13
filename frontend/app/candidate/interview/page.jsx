'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Video, VideoOff, Mic, MicOff, Shield, AlertTriangle,
  CheckCircle2, Clock, Play, Square, Loader2, XCircle, Send,
  Eye, EyeOff, Wifi, User, Volume2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { getInterviewSession, submitInterviewAnswer, uploadAudioForTranscription } from '@/lib/interview/api';
import EyeGazeTracker from '@/components/interview/EyeGazeTracker';

// Interview components
import HRCameraTile from '@/components/interview/HRCameraTile';

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATE INTERVIEW ROOM
//
// What the CANDIDATE sees and does:
//   • Consent notice → camera + mic permission request
//   • Dual video interface:
//       1. HR Interviewer Video Tile (incoming stream / placeholder)
//       2. Candidate Self-Preview (proctoring webcam feed)
//   • Current active question displayed (sent by HR / AI backend)
//   • Voice recording of their spoken answer with Whisper transcription
//   • Proctoring warning bar (tab-switch notices)
//   • Submit answer → advances to next question
// ─────────────────────────────────────────────────────────────────────────────

// Voice recorder states
const REC = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
};

export default function CandidateInterviewPage() {
  const sessionIdRef = useRef(null);
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [gazeAssessment, setGazeAssessment] = useState({ status: 'loading' });

  // ── Permission & Session Phase ────────────────────────────────────────────
  const [phase, setPhase] = useState('entry'); // entry|validating|consent|requesting|active|denied|submitted|invalid
  const [permError, setPermError] = useState('');
  const [invitationInput, setInvitationInput] = useState('');

  // ── Media ──────────────────────────────────────────────────────────────────
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);

  // ── Session ────────────────────────────────────────────────────────────────
  const [sessionDuration, setSessionDuration] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(null);

  // ── Proctoring (candidate-visible warnings) ────────────────────────────────
  const [tabWarning, setTabWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [typingWarning, setTypingWarning] = useState(false);

  // ── Voice recording ────────────────────────────────────────────────────────
  const [recState, setRecState] = useState(REC.IDLE);
  const [recTimer, setRecTimer] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recError, setRecError] = useState('');
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [awaitingNextQuestion, setAwaitingNextQuestion] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [sessionEndedByRecruiter, setSessionEndedByRecruiter] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordingQuestionRef = useRef(null);
  const lastQuestionVersionRef = useRef(0);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const sessionClosedRef = useRef(false);
  const typingBurstRef = useRef({ count: 0, startedAt: null, timer: null });
  const handleGazeStatus = useCallback((assessment) => setGazeAssessment(assessment), []);

  const closeCandidateRoom = useCallback((endedByRecruiter = false) => {
    sessionClosedRef.current = true;
    if (mediaRecorderRef.current?.state && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // The recorder may already be stopping as the room closes.
      }
    }
    clearInterval(recTimerRef.current);
    clearInterval(sessionTimerRef.current);
    mediaStream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setMediaStream(null);
    setSessionEndedByRecruiter(endedByRecruiter);
    setPhase('submitted');
  }, [mediaStream]);

  const validateInvitation = useCallback(async (sessionId) => {
    setPhase('validating');
    setSessionError('');
    try {
      const existing = await getInterviewSession(sessionId);
      if (existing.session_id !== sessionId && existing.id !== sessionId) {
        throw new Error('This link does not match an interview session. Check the link and try again.');
      }
      if (!existing.candidate_id) throw new Error('This interview session has no associated candidate. Ask HR for a new link.');
      if (existing.status !== 'active') throw new Error('This interview is no longer open. Ask HR to create a new interview link.');
      sessionClosedRef.current = false;
      sessionIdRef.current = sessionId;
      setSession(existing);
      setActiveQuestion(existing.current_question || null);
      lastQuestionVersionRef.current = existing.current_question?.version || 0;
      setPhase('consent');
    } catch (error) {
      sessionIdRef.current = null;
      setSessionError(error.message || 'Could not validate this interview invitation. Check the link and try again.');
      setPhase('entry');
    }
  }, []);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) return undefined;
    const validationTimer = window.setTimeout(() => validateInvitation(sessionId), 0);
    return () => window.clearTimeout(validationTimer);
  }, [validateInvitation]);

  const handleInvitationSubmit = (event) => {
    event.preventDefault();
    const value = invitationInput.trim();
    let sessionId = value;
    try {
      const pastedUrl = new URL(value, window.location.origin);
      sessionId = pastedUrl.searchParams.get('session_id') || (pastedUrl.pathname === '/candidate/interview' ? '' : value);
    } catch {
      // Treat a plain session ID as a valid input candidate.
    }
    if (!sessionId || /[/?#\s]/.test(sessionId)) {
      setSessionError('Paste the full interview link from HR, or enter its session ID.');
      return;
    }
    validateInvitation(sessionId);
  };

  useEffect(() => {
    if (!['consent', 'requesting', 'active'].includes(phase) || !sessionIdRef.current) return undefined;
    let mounted = true;
    const refreshSession = async () => {
      try {
        const latest = await getInterviewSession(sessionIdRef.current);
        if (!mounted) return;
        if (latest.status !== 'active') {
          closeCandidateRoom(true);
          return;
        }
        if (phase !== 'active' || !latest.current_question) return;
        if (latest.current_question.version > lastQuestionVersionRef.current) {
          lastQuestionVersionRef.current = latest.current_question.version;
          setActiveQuestion(latest.current_question);
          setAwaitingNextQuestion(false);
          setSubmitError('');
        }
      } catch {
        // Keep the last received question visible through transient polling errors.
      }
    };
    refreshSession();
    const interval = setInterval(refreshSession, 1200);
    return () => { mounted = false; clearInterval(interval); };
  }, [phase, closeCandidateRoom]);

  // ── Attach stream to video ──────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [mediaStream]);

  // ── Session timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active') return;
    sessionTimerRef.current = setInterval(() => setSessionDuration((d) => d + 1), 1000);
    return () => clearInterval(sessionTimerRef.current);
  }, [phase]);

  // ── Browser integrity detection (candidate-side logging) ──────────────
  useEffect(() => {
    if (phase !== 'active') return;

    const flushTypingBurst = () => {
      const burst = typingBurstRef.current;
      if (burst.timer) clearTimeout(burst.timer);
      burst.timer = null;
      if (!burst.count) return;

      api.interviews.recordEvent(sessionIdRef.current, {
        event_type: 'typing_detected',
        timestamp: new Date().toISOString(),
        details: {
          key_count: burst.count,
          duration_ms: Date.now() - burst.startedAt,
          source: 'candidate_interview_page',
        },
      }).catch(() => {});
      burst.count = 0;
      burst.startedAt = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((n) => n + 1);
        setTabWarning(true);
        // BACKEND INTEGRATION: POST /api/interviews/{sessionId}/events
        api.interviews.recordEvent(sessionIdRef.current, {
          event_type: 'tab_switch',
          timestamp: new Date().toISOString(),
          details: { role: 'candidate' },
        }).catch(() => {});
      }
    };

    const onBlur = () => {
      api.interviews.recordEvent(sessionIdRef.current, {
        event_type: 'focus_loss',
        timestamp: new Date().toISOString(),
        details: { role: 'candidate' },
      }).catch(() => {});
      flushTypingBurst();
    };

    const onKeyDown = (event) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      const burst = typingBurstRef.current;
      if (!burst.count) burst.startedAt = Date.now();
      burst.count += 1;
      setTypingWarning(true);
      if (burst.timer) clearTimeout(burst.timer);
      burst.timer = setTimeout(flushTypingBurst, 1200);
    };

    const onPaste = (e) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text.length > 50) {
        api.interviews.recordEvent(sessionIdRef.current, {
          event_type: 'large_paste',
          timestamp: new Date().toISOString(),
          details: { char_count: text.length },
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('paste', onPaste);
    return () => {
      flushTypingBurst();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('paste', onPaste);
    };
  }, [phase]);

  // ─────────────────────────────────────────────────────────────────────────
  // PERMISSION FLOW — Camera & Microphone
  // ─────────────────────────────────────────────────────────────────────────
  const handleLaunchSession = async () => {
    if (!session || !sessionIdRef.current || sessionClosedRef.current) {
      setSessionError('A valid HR-created interview session is required before joining.');
      setPhase('invalid');
      return;
    }
    setPhase('requesting');
    setPermError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (sessionClosedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      setMediaStream(stream);
      setPhase('active');
    } catch (err) {
      if (sessionClosedRef.current) return;
      const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setPermError(
        denied
          ? 'Camera or microphone was denied. Please allow permissions in your browser settings and try again.'
          : `Could not access media devices: ${err.message}`
      );
      setPhase('denied');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VOICE RECORDING (Whisper speech-to-text integration point)
  // ─────────────────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setRecError('');
    setTranscript('');
    chunksRef.current = [];
    if (!activeQuestion) {
      setRecError('Waiting for the interviewer to send a question.');
      setRecState(REC.ERROR);
      return;
    }

    try {
      let stream = mediaStream;
      if (!stream) {
        setRecState(REC.REQUESTING);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) throw new Error('No microphone audio track is available.');
      // The shared interview stream also contains the camera track. Keep that
      // stream alive for gaze tracking, but give MediaRecorder audio only.
      const audioStream = new MediaStream(audioTracks);
      if (!activeQuestion) throw new Error('Waiting for the interviewer to send a question.');
      recordingQuestionRef.current = activeQuestion;
      const audioMimeType = 'audio/webm;codecs=opus';
      const mr = new MediaRecorder(
        audioStream,
        MediaRecorder.isTypeSupported(audioMimeType) ? { mimeType: audioMimeType } : undefined
      );
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        if (sessionClosedRef.current) {
          if (!mediaStream) stream.getTracks().forEach((track) => track.stop());
          return;
        }
        await processAudio();
        if (!mediaStream) stream.getTracks().forEach((track) => track.stop());
      };
      mr.start(250);
      mediaRecorderRef.current = mr;

      setRecTimer(0);
      recTimerRef.current = setInterval(() => setRecTimer((t) => t + 1), 1000);
      setRecState(REC.RECORDING);
    } catch (err) {
      const denied = err.name === 'NotAllowedError';
      setRecError(denied ? 'Microphone access denied.' : `Recording error: ${err.message}`);
      setRecState(REC.ERROR);
    }
  }, [activeQuestion, mediaStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
    clearInterval(recTimerRef.current);
    setRecState(REC.PROCESSING);
  }, []);

  const processAudio = async () => {
    try {
      const currentQuestion = recordingQuestionRef.current || activeQuestion;
      const audioType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(chunksRef.current, { type: audioType });
      if (!audioBlob.size) throw new Error('No audio was captured. Check microphone access and try again.');
      const result = await uploadAudioForTranscription(
        sessionIdRef.current,
        audioBlob,
        currentQuestion?.question_id
      );
      setTranscript(result.transcript_text || '');
      setRecState(REC.READY);
    } catch (error) {
      setRecError(error.message || 'Could not transcribe this recording.');
      setRecState(REC.ERROR);
    }
  };

  const submitAnswer = async () => {
    const current = recordingQuestionRef.current || activeQuestion;
    if (!current) {
      setSubmitError('Waiting for the interviewer to send a question.');
      return;
    }
    setIsSubmittingAnswer(true);
    setSubmitError('');
    try {
      const savedAnswer = await submitInterviewAnswer(sessionIdRef.current, {
        question_id: current.question_id,
        question: current.question,
        category: current.category,
        transcript,
      });
      setSubmittedAnswers((prev) => [...prev, {
        question: current.question,
        answer: transcript,
        questionId: current.question_id,
        timestamp: new Date(savedAnswer.submitted_at).toLocaleTimeString(),
        analysisStatus: savedAnswer.analysis_status,
      }]);

      setTranscript('');
      setRecState(REC.IDLE);
      setRecTimer(0);
      setAwaitingNextQuestion(true);
      recordingQuestionRef.current = null;
    } catch (error) {
      setSubmitError(error.message || 'Could not submit your answer. Please retry.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (phase === 'validating') {
    return <div className="max-w-md mx-auto text-center py-24 space-y-3"><Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" /><h2 className="text-lg font-semibold text-slate-800">Validating interview invitation</h2><p className="text-sm text-slate-500">Checking the session created by the hiring team…</p></div>;
  }

  if (phase === 'entry') {
    return (
      <div className="max-w-xl mx-auto py-10 sm:py-16">
        <Card className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Join your interview</h1>
              <p className="text-sm text-slate-600 mt-1">Paste the interview link shared by your recruiter. We’ll check that the room is open before you join.</p>
            </div>
          </div>

          <form onSubmit={handleInvitationSubmit} className="space-y-3">
            <label htmlFor="interview-invitation" className="block text-xs font-semibold text-slate-700">Interview link or session ID</label>
            <input
              id="interview-invitation"
              type="text"
              value={invitationInput}
              onChange={(event) => setInvitationInput(event.target.value)}
              placeholder="Paste the link from your recruiter"
              autoComplete="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {sessionError && <p role="alert" className="text-xs text-rose-700">{sessionError}</p>}
            <Button type="submit" className="w-full" icon={Video}>
              Check interview link
            </Button>
          </form>

          <p className="text-xs text-slate-500 border-t border-slate-100 pt-4">
            Don’t have a link, or is the room closed? Contact your recruiter and ask them to generate a new interview link.
          </p>
        </Card>
      </div>
    );
  }

  if (phase === 'invalid') {
    return <div className="max-w-md mx-auto py-24"><Card className="p-8 text-center space-y-4 border-rose-200"><XCircle className="w-12 h-12 text-rose-600 mx-auto" /><h2 className="text-lg font-semibold text-slate-900">Unable to join interview</h2><p role="alert" className="text-sm text-slate-600">{sessionError}</p><Link href="/candidate" className="inline-block text-sm font-medium text-indigo-600 hover:underline">Return to Candidate Portal</Link></Card></div>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Consent Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'consent') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Technical Interview Room</h1>
          <p className="text-sm text-slate-500 mt-1">TrustHire Proctored Candidate Assessment Environment</p>
          <p className="text-xs text-slate-500 mt-2">Interview for candidate {session?.candidate_id} · Session #{sessionIdRef.current?.slice(-6)}</p>
        </div>

        <Card className="p-8 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to Your Interview Room</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Please review the environment setup before joining the live video session.
            </p>
          </div>

          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            {[
              { icon: Video, text: 'Webcam will be active for identity verification and attentiveness monitoring.' },
              { icon: Mic, text: 'Microphone will record your spoken responses for automated transcription.' },
              { icon: Eye, text: 'Tab switching and window blur events are logged to maintain integrity.' },
              { icon: User, text: 'You will see the HR / AI Interviewer video feed directly in the room.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800">
            <strong>Format:</strong> Live interviewer-led questions · Speak answers aloud · Preview transcription before submitting
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleLaunchSession}
            className="w-full font-semibold"
            icon={Play}
          >
            I Agree — Enter Interview Room
          </Button>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Requesting Permissions
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'requesting') {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
        <h2 className="text-lg font-semibold text-slate-800">Connecting Audio & Video Devices</h2>
        <p className="text-sm text-slate-500">Please grant camera and microphone access when prompted by your browser.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Permission Denied
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'denied') {
    return (
      <div className="max-w-md mx-auto py-24 space-y-6">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Device Permissions Required</h2>
          <p className="text-sm text-slate-500">{permError}</p>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" onClick={() => setPhase('consent')} className="flex-1">Go Back</Button>
            <Button variant="primary" size="md" onClick={handleLaunchSession} className="flex-1">Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Session Completed
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-10">
        <Card className="p-8 text-center space-y-6 shadow-sm border-emerald-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {sessionEndedByRecruiter ? 'The recruiter ended this interview' : 'Assessment Submitted Successfully!'}
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              {sessionEndedByRecruiter
                ? 'This interview room is now closed. Any answers you submitted have been saved for the hiring team.'
                : 'Your spoken answers and session integrity records have been securely delivered to the hiring team.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-2xl font-bold text-indigo-600">{submittedAnswers.length}</p>
              <p className="text-xs text-slate-500">Answers Recorded</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-2xl font-bold text-slate-700">{formatTime(sessionDuration)}</p>
              <p className="text-xs text-slate-500">Interview Duration</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/candidate/status">
              <Button variant="primary" size="md">View Application Status</Button>
            </Link>
            <Link href="/candidate">
              <Button variant="secondary" size="md">Candidate Portal Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Active Interview Room
  // ─────────────────────────────────────────────────────────────────────────
  const currentQ = activeQuestion;
  const progress = session?.total_questions
    ? Math.min(100, (submittedAnswers.length / session.total_questions) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8">
      {/* Top Session Status Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">Technical Assessment Room</h1>
          <p className="text-xs text-slate-500">Live proctored interview · Connected to hiring panel</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-mono font-bold text-slate-700">{formatTime(sessionDuration)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Session Live
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
            gazeAssessment.status === 'high' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : gazeAssessment.status === 'low' ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            Eye check: {gazeAssessment.status === 'high' ? 'Looking at screen' : gazeAssessment.status === 'low' ? 'Look toward screen' : gazeAssessment.status === 'error' ? 'Unavailable' : 'Starting'}
          </div>
        </div>
      </div>

      <EyeGazeTracker stream={mediaStream} sessionId={sessionIdRef.current} onStatus={handleGazeStatus} />

      {/* Tab-switch warning notice (Visible to candidate) */}
      {tabWarning && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Warning:</strong> Tab switch detected ({tabSwitchCount}). Assessment rules require keeping this window active. All window focus losses are recorded.
            </span>
          </div>
          <button onClick={() => setTabWarning(false)} className="text-amber-700 hover:text-amber-900 font-bold ml-2">×</button>
        </div>
      )}

      {typingWarning && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-amber-900 text-xs">
          <span><strong>Typing detected:</strong> Keyboard input is logged as a typing event; typed content is not recorded.</span>
          <button onClick={() => setTypingWarning(false)} className="text-amber-700 hover:text-amber-900 font-bold ml-2" aria-label="Dismiss typing warning">×</button>
        </div>
      )}

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Question {currentQ?.version || 1} · {submittedAnswers.length} answered</span>
          <span className="capitalize font-medium text-indigo-600">{currentQ?.category || 'Waiting'}</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: Question & Voice Answer Recorder (7 cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Question Display */}
          <Card className="p-6 shadow-xs border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Question {currentQ?.version || 1}: {currentQ?.category || 'Waiting'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {submittedAnswers.length} answered
              </span>
            </div>
            <p className="text-base text-slate-800 leading-relaxed font-medium">
              {currentQ?.question || 'Waiting for the interviewer to send the next question…'}
            </p>
          </Card>

          {/* Voice Response Area */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="py-3 px-5 border-b border-slate-100 flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Your Spoken Answer</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mic className="w-3.5 h-3.5 text-indigo-500" />
                <span>Whisper Speech-to-Text</span>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Idle State */}
              {recState === REC.IDLE && awaitingNextQuestion && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">Answer submitted</p>
                  <p className="mt-1 text-xs text-emerald-700">Your transcript is with the hiring team. Waiting for their next question.</p>
                </div>
              )}
              {recState === REC.IDLE && !awaitingNextQuestion && (
                <div className="text-center py-6 space-y-3">
                  <button
                    onClick={startRecording}
                    disabled={!activeQuestion}
                    className="w-18 h-18 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center mx-auto shadow-md transition-all hover:scale-105 active:scale-95"
                    aria-label="Start recording answer"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                  <p className="text-xs text-slate-500">{activeQuestion ? 'Click to start recording your response' : 'Waiting for a question from the interviewer…'}</p>
                </div>
              )}

              {/* Requesting */}
              {recState === REC.REQUESTING && (
                <div className="text-center py-6 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-500">Initializing microphone…</p>
                </div>
              )}

              {/* Recording State */}
              {recState === REC.RECORDING && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-xs font-bold text-rose-700 uppercase">Recording Response…</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-700">{formatTime(recTimer)}</span>
                  </div>

                  {/* Audio Waveform */}
                  <div className="flex items-center justify-center gap-1 h-12 bg-slate-50 rounded-xl p-2 border border-slate-100">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-indigo-500 rounded-full animate-pulse"
                        style={{ height: `${12 + Math.sin(i * 0.7) * 16}px`, animationDelay: `${i * 0.05}s` }}
                      />
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={stopRecording}
                      className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-105"
                      aria-label="Stop recording"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-center text-[11px] text-slate-400">Click the square when finished speaking</p>
                </div>
              )}

              {/* Processing */}
              {recState === REC.PROCESSING && (
                <div className="text-center py-6 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-600">Transcribing response with Whisper speech-to-text…</p>
                </div>
              )}

              {/* Error */}
              {recState === REC.ERROR && (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{recError}</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={startRecording} className="w-full">Try Again</Button>
                </div>
              )}

              {/* Ready: Transcription preview */}
              {recState === REC.READY && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Transcribed Response</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed">"{transcript}"</p>
                  </div>

                  <div className="flex gap-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setRecState(REC.IDLE); setTranscript(''); }}
                      className="flex-1"
                      icon={MicOff}
                    >
                      Re-record
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={submitAnswer}
                      disabled={isSubmittingAnswer || transcript.trim().length < 5}
                      className="flex-1 font-semibold"
                      icon={Send}
                    >
                      {isSubmittingAnswer ? 'Submitting…' : 'Submit Answer'}
                    </Button>
                  </div>
                  {submitError && <p role="alert" className="text-xs text-rose-700">{submitError}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submitted Answers History */}
          {submittedAnswers.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Submitted Answers ({submittedAnswers.length})
              </span>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {submittedAnswers.map((a, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-700">Q{i + 1}: {a.question}</p>
                    <p className="text-slate-500 mt-1 italic line-clamp-2">"{a.answer}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Dual Video Feeds (HR Camera + Candidate Self Preview) (5 cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tile 1: HR Interviewer Live Camera Feed */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-indigo-600" />
                Interviewer Camera
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Connected
              </span>
            </div>
            <HRCameraTile
              mode="candidate"
              interviewerName="Lead Technical Recruiter"
              interviewerRole="TrustHire Evaluation Panel"
              isSpeaking={recState === REC.IDLE}
            />
          </div>

          {/* Tile 2: Candidate's Own Camera Preview (Proctored Feed) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Your Camera (Proctored Feed)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Self Preview</span>
            </div>

            <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video border border-slate-800 shadow-xs flex items-center justify-center">
              {mediaStream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-white font-medium">Proctoring Active</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 p-4 space-y-1">
                  <VideoOff className="w-7 h-7 mx-auto opacity-30" />
                  <p className="text-xs">Webcam stream inactive</p>
                </div>
              )}
            </div>
          </div>

          {/* Proctoring Notice Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800 block">Proctoring Rules</span>
            <ul className="space-y-1 text-[11px] text-slate-500 list-disc list-inside">
              <li>Stay facing your screen during all questions</li>
              <li>Do not open other applications or browser tabs</li>
              <li>Speak clearly into the microphone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
