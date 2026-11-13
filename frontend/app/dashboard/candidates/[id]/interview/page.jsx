'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, Shield, AlertTriangle,
  CheckCircle2, Clock, Play, Square, ChevronRight, Clipboard, Eye,
  MessageSquare, FileText, Camera, Sparkles, Loader2, XCircle,
  Monitor, MonitorOff, ExternalLink, Flag, Send, RefreshCw, ThumbsUp,
  UserCheck, ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { DEMO_CANDIDATES } from '@/lib/constants';

// Interview-specific components
import InterviewHeader from '@/components/interview/InterviewHeader';
import AIQuestionCard from '@/components/interview/AIQuestionCard';
import CameraMonitorPanel from '@/components/interview/CameraMonitorPanel';
import HRCameraTile from '@/components/interview/HRCameraTile';
import IntegrityMonitorPanel from '@/components/interview/IntegrityMonitorPanel';
import InterviewHistory from '@/components/interview/InterviewHistory';
import DocumentConsistencyPanel from '@/components/interview/DocumentConsistencyPanel';
import AIQuestionAssistant from '@/components/interview/AIQuestionAssistant';
import ResumeQuestionGenerator from '@/components/interview/ResumeQuestionGenerator';
import CandidateAnswerReview from '@/components/interview/CandidateAnswerReview';
import EndInterviewModal from '@/components/interview/EndInterviewModal';
import InterviewCompletion from '@/components/interview/InterviewCompletion';

// Interview API & Mock Data
import {
  createInterviewSession, getInterviewSession, recordIntegrityEvent,
  dispatchInterviewQuestion, saveInterviewQuestionQueue, generateQuestionsFromResume,
} from '@/lib/interview/api';

const COPILOT_TABS = [
  { id: 'live',       label: 'Live Q&A',        Icon: MessageSquare },
  { id: 'resume',     label: 'Resume Scanner', Icon: FileText },
  { id: 'questions',  label: 'AI Questions',   Icon: Sparkles },
  { id: 'documents',  label: 'Discrepancies',  Icon: Clipboard },
  { id: 'integrity',  label: 'Integrity Logs', Icon: Shield },
];

export default function HRInterviewMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params?.id || 'cand-sarah-001';

  // ── Candidate info ────────────────────────────────────────────────────────
  const [candidate, setCandidate] = useState(null);

  // ── Monitor status ────────────────────────────────────────────────────────
  const [isMonitorLaunched, setIsMonitorLaunched] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [launchError, setLaunchError] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const invitationUrl = sessionId && typeof window !== 'undefined'
    ? `${window.location.origin}/candidate/interview?session_id=${encodeURIComponent(sessionId)}`
    : '';
  const [completed, setCompleted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // ── Camera & Gaze Proctoring Stream ───────────────────────────────────────
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // ── Q&A & Candidate Response Review ───────────────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState('Tell me about yourself — specifically your background and what brought you to apply for this role.');
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('opening');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [questionSuggestions, setQuestionSuggestions] = useState([]);
  const [questionError, setQuestionError] = useState('');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isDispatchingQuestion, setIsDispatchingQuestion] = useState(false);
  const [history, setHistory] = useState([]);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [isCurrentAnswerFlagged, setIsCurrentAnswerFlagged] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState(null);
  const [customQuestionInput, setCustomQuestionInput] = useState('');

  // ── Integrity monitoring ──────────────────────────────────────────────────
  const [tabSwitches, setTabSwitches] = useState(0);
  const [typingDetections, setTypingDetections] = useState(0);
  const [focusLosses, setFocusLosses] = useState(0);
  const [pasteEvents, setPasteEvents] = useState(0);
  const [gazeAwayCount, setGazeAwayCount] = useState(0);
  const [gazeAssessment, setGazeAssessment] = useState({ status: 'unknown', attentionPct: null, faceDetected: null });
  const [integrityEvents, setIntegrityEvents] = useState([]);
  const [screenSharing, setScreenSharing] = useState(false);
  const [copilotTab, setCopilotTab] = useState('live');

  const timerRef = useRef(null);
  const lastGazeStatusRef = useRef(null);
  const lastAnswerSignatureRef = useRef(null);
  const lastQuestionVersionRef = useRef(0);
  const lastArchivedAnswerIdRef = useRef(null);
  const questionQueueRef = useRef([]);
  const questionQueueSaveRef = useRef(Promise.resolve());
  const questionQueueSaveVersionRef = useRef(0);

  useEffect(() => {
    if (!isMonitorLaunched || !sessionId) return undefined;
    let mounted = true;

    const refreshGazeAssessment = async () => {
      try {
        const session = await getInterviewSession(sessionId);
        if (!mounted) return;
        const latestSubmittedAnswer = session.answers?.[session.answers.length - 1];
        const answerSignature = latestSubmittedAnswer
          ? `${latestSubmittedAnswer.id}:${latestSubmittedAnswer.analysis_status || 'pending'}:${latestSubmittedAnswer.ai_score ?? ''}`
          : null;
        if (latestSubmittedAnswer && answerSignature !== lastAnswerSignatureRef.current) {
          lastAnswerSignatureRef.current = answerSignature;
          setLatestAnswer({
            id: latestSubmittedAnswer.id,
            text: latestSubmittedAnswer.transcript,
            question: latestSubmittedAnswer.question,
            aiScore: latestSubmittedAnswer.ai_score,
            verdict: latestSubmittedAnswer.verdict,
            flaggedForReview: latestSubmittedAnswer.flagged_for_review,
            confidence: latestSubmittedAnswer.confidence,
            analysisSource: latestSubmittedAnswer.analysis_source,
            modelError: latestSubmittedAnswer.model_error,
            reasons: latestSubmittedAnswer.reasons,
            signals: latestSubmittedAnswer.signals,
            note: latestSubmittedAnswer.note,
            analysisStatus: latestSubmittedAnswer.analysis_status || 'complete',
            timestamp: new Date(latestSubmittedAnswer.submitted_at).toLocaleTimeString(),
          });
          setCurrentQuestion(latestSubmittedAnswer.question);
          setCurrentQuestionId(latestSubmittedAnswer.question_id || null);
          setCurrentCategory(latestSubmittedAnswer.category || 'general');
          setIsCandidateSpeaking(false);
        }
        const activeQuestion = session.current_question;
        if (activeQuestion && activeQuestion.version > lastQuestionVersionRef.current) {
          lastQuestionVersionRef.current = activeQuestion.version;
          setCurrentQuestion(activeQuestion.question);
          setCurrentQuestionId(activeQuestion.question_id || null);
          setCurrentCategory(activeQuestion.category || 'general');
          setQuestionIndex(activeQuestion.version);
          setIsCandidateSpeaking(false);
        }
        const sessionEvents = session.events || [];
        const tabEvents = sessionEvents.filter((event) => event.event_type === 'tab_switch');
        const typingEvents = sessionEvents.filter((event) => event.event_type === 'typing_detected');
        const focusEvents = sessionEvents.filter((event) => ['focus_loss', 'window_blur'].includes(event.event_type));
        const pasteEvents = sessionEvents.filter((event) => ['large_paste', 'copy_paste'].includes(event.event_type));
        setTabSwitches(tabEvents.length);
        setTypingDetections(typingEvents.length);
        setFocusLosses(focusEvents.length);
        setPasteEvents(pasteEvents.length);
        setIntegrityEvents([...sessionEvents].reverse().map((event) => ({
          eventType: event.event_type,
          severity: event.event_type === 'ai_response_suspected'
            ? 'high'
            : event.event_type === 'tab_switch' || event.event_type === 'large_paste'
            ? 'high'
            : event.event_type === 'typing_detected'
              ? 'medium'
              : event.details?.status === 'low' ? 'high' : 'low',
          timestamp: event.timestamp,
          metadata: event.details,
        })));
        const updatedAt = session.gaze_updated_at ? Date.parse(session.gaze_updated_at) : 0;
        const isFresh = updatedAt > 0 && Date.now() - updatedAt <= 10000;
        const status = isFresh ? (session.gaze_status || 'unknown') : 'unknown';
        const attentionPct = isFresh ? session.gaze_attention_score : null;
        setGazeAssessment({
          status,
          attentionPct,
          faceDetected: isFresh ? session.gaze_face_detected : null,
          updatedAt: isFresh ? session.gaze_updated_at : null,
        });

        if (isFresh && status !== lastGazeStatusRef.current) {
          lastGazeStatusRef.current = status;
          if (status === 'low') setGazeAwayCount((count) => count + 1);
          if (status === 'high' || status === 'low') {
            setIntegrityEvents((events) => [{
              eventType: `gaze_${status}`,
              severity: status === 'low' ? 'high' : 'low',
              timestamp: session.gaze_updated_at,
              metadata: { attention_score: attentionPct, face_detected: session.gaze_face_detected },
            }, ...events]);
          }
        }
      } catch (error) {
        if (!mounted || error?.status !== 404) return;
        setLaunchError('This interview session no longer exists. It may have been cleared when the in-memory backend restarted. Launch a new session and share its new Candidate Room link.');
        mediaStream?.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        setSessionDuration(0);
        setIsMonitorLaunched(false);
        setSessionId(null);
        // A missed poll keeps the last confirmed status until its freshness window expires.
      }
    };

    refreshGazeAssessment();
    const interval = setInterval(refreshGazeAssessment, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isMonitorLaunched, sessionId]);

  // ── Load candidate ────────────────────────────────────────────────────────
  useEffect(() => {
    const found = DEMO_CANDIDATES.find((c) => c.id === candidateId) || DEMO_CANDIDATES[0];
    setCandidate(found);
  }, [candidateId]);

  // ── Timer loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMonitorLaunched) return;
    timerRef.current = setInterval(() => setSessionDuration((d) => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [isMonitorLaunched]);

  // ── Handle Integrity Events ───────────────────────────────────────────────
  const addIntegrityEvent = useCallback((event) => {
    setIntegrityEvents((prev) => [event, ...prev]);
    if (event.eventType === 'gaze_away') {
      setGazeAwayCount((c) => c + 1);
    }
    recordIntegrityEvent(sessionId, event).catch(() => {});
  }, [sessionId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Launch Interview Monitor
  // ─────────────────────────────────────────────────────────────────────────
  const handleLaunchMonitor = async () => {
    setIsLaunching(true);
    setCameraError(null);
    setLaunchError('');

    try {
      const session = await createInterviewSession(candidateId);
      const backendSessionId = session.session_id || session.id;
      if (!backendSessionId) throw new Error('The backend did not return an interview session ID.');
      setSessionId(backendSessionId);
      const initialSession = await getInterviewSession(backendSessionId);
      const initialQueue = initialSession.question_queue || [];
      questionQueueRef.current = initialQueue;
      setQuestionQueue(initialQueue);
      if (initialSession.current_question) {
        setCurrentQuestion(initialSession.current_question.question);
        setCurrentQuestionId(initialSession.current_question.question_id || null);
        setCurrentCategory(initialSession.current_question.category || 'opening');
        setQuestionIndex(initialSession.current_question.version || 1);
        lastQuestionVersionRef.current = initialSession.current_question.version || 1;
      }

      let stream = null;
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false,
          });
          setMediaStream(stream);
        } catch (mediaErr) {
          console.warn('Webcam preview note:', mediaErr);
          setCameraError('Running proctoring in simulation/telemetry-only mode.');
        }
      }

      recordIntegrityEvent(backendSessionId, {
        eventType: 'monitor_launched',
        severity: 'low',
        timestamp: new Date().toISOString(),
        metadata: { role: 'hr_interviewer', candidate_id: candidateId },
      });

      setIsMonitorLaunched(true);
    } catch (err) {
      console.error('Launch monitor error:', err);
      setLaunchError(err.message || 'Could not create the interview session. Please try again.');
    } finally {
      setIsLaunching(false);
    }
  };

  const copyInvitation = async () => {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1800);
    } catch {
      setLaunchError('Could not copy the invitation link. Please copy it from the field.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Dispatch Question to Candidate
  // ─────────────────────────────────────────────────────────────────────────
  const handleDispatchQuestion = async (questionText, category = 'custom', questionId) => {
    const text = typeof questionText === 'object' ? questionText.question_text || questionText.question : questionText;
    const resolvedCategory = typeof questionText === 'object' ? questionText.category || category : category;
    const resolvedId = typeof questionText === 'object' ? questionText.question_id : questionId;
    if (!text?.trim() || !sessionId || isDispatchingQuestion) return;
    setIsDispatchingQuestion(true);
    setQuestionError('');

    try {
      const dispatched = await dispatchInterviewQuestion(sessionId, {
        question_id: resolvedId || `q-${Date.now()}`,
        question: text.trim(),
        category: resolvedCategory,
      });
      if (latestAnswer && lastArchivedAnswerIdRef.current !== latestAnswer.id) {
        lastArchivedAnswerIdRef.current = latestAnswer.id;
        setHistory((prev) => [...prev, {
          question: latestAnswer.question || currentQuestion,
          category: currentCategory,
          answer: latestAnswer.text,
          aiScore: latestAnswer.aiScore,
          aiFlag: latestAnswer.flaggedForReview,
          timestamp: new Date().toISOString(),
        }]);
      }
      setCurrentQuestion(dispatched.question);
      setCurrentQuestionId(dispatched.question_id);
      setCurrentCategory(dispatched.category);
      setQuestionIndex(dispatched.version);
      lastQuestionVersionRef.current = dispatched.version;
      const queuedQuestions = questionQueueRef.current;
      if (!queuedQuestions.some((item) => item.question_id === dispatched.question_id)) {
        await persistQuestionQueue([...queuedQuestions, {
          question_id: dispatched.question_id,
          question: dispatched.question,
          category: dispatched.category,
        }]);
      }
      setCustomQuestionInput('');
      setIsCandidateSpeaking(false);
    } catch (error) {
      setQuestionError(error.message || 'Could not send the question to the candidate.');
    } finally {
      setIsDispatchingQuestion(false);
    }
  };

  const persistQuestionQueue = async (nextQueue) => {
    questionQueueRef.current = nextQueue;
    setQuestionQueue(nextQueue);
    if (!sessionId) return;

    const saveVersion = ++questionQueueSaveVersionRef.current;
    const savePromise = questionQueueSaveRef.current
      .catch(() => {})
      .then(() => saveInterviewQuestionQueue(sessionId, nextQueue));
    questionQueueSaveRef.current = savePromise;
    try {
      await savePromise;
      if (saveVersion === questionQueueSaveVersionRef.current) setQuestionError('');
    } catch (error) {
      if (saveVersion === questionQueueSaveVersionRef.current) {
        setQuestionError(error.message || 'Could not save the question order.');
      }
    }
  };

  const moveQueuedQuestion = (index, offset) => {
    const nextIndex = index + offset;
    const currentQueue = questionQueueRef.current;
    if (nextIndex < 0 || nextIndex >= currentQueue.length) return;
    const nextQueue = [...currentQueue];
    [nextQueue[index], nextQueue[nextIndex]] = [nextQueue[nextIndex], nextQueue[index]];
    persistQuestionQueue(nextQueue);
  };

  const generateGemmaQuestion = async () => {
    if (!sessionId || isGeneratingQuestion) return;
    setIsGeneratingQuestion(true);
    setQuestionError('');
    try {
      const generated = await generateQuestionsFromResume(sessionId, {});
      const question = generated[0];
      setQuestionSuggestions((items) => [question, ...items]);
      const queued = { question_id: question.question_id, question: question.question_text, category: question.category };
      await persistQuestionQueue([...questionQueueRef.current, queued]);
    } catch (error) {
      setQuestionError(error.message || 'Gemma could not generate a question. Check that the local model is running.');
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleEndSession = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
    setCompleted(true);
  };

  const handleResetSession = () => {
    setCompleted(false);
    setIsMonitorLaunched(false);
    setSessionDuration(0);
    setHistory([]);
    setIntegrityEvents([]);
    setTabSwitches(0);
    setTypingDetections(0);
    setGazeAwayCount(0);
    setLatestAnswer(null);
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Integrity assessment
  const isCritical = tabSwitches >= 5 || gazeAwayCount >= 5;
  const isWarning = tabSwitches >= 2 || gazeAwayCount >= 2 || latestAnswer?.flaggedForReview || history.some((h) => h.aiFlag || h.aiScore >= 40);
  const overallRisk = isCritical ? 'critical' : isWarning ? 'warning' : 'clean';

  const handleFlagCurrentAnswer = () => {
    setIsCurrentAnswerFlagged((flagged) => !flagged);
    addIntegrityEvent({
      eventType: 'manual_hr_flag',
      severity: 'high',
      timestamp: new Date().toISOString(),
      metadata: { reason: 'HR flagged response for review', question: currentQuestion },
    });
  };

  const handleNextQuestion = () => {
    const currentIndex = currentQuestionId
      ? questionQueue.findIndex((question) => question.question_id === currentQuestionId)
      : questionQueue.findIndex((question) => question.question === currentQuestion);
    const nextQuestion = questionQueue[currentIndex + 1] || questionQueue.find((question) => currentQuestionId
      ? question.question_id !== currentQuestionId
      : question.question !== currentQuestion);
    if (nextQuestion) handleDispatchQuestion(nextQuestion.question, nextQuestion.category, nextQuestion.question_id);
    else setQuestionError('Add or generate another question before continuing.');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Session Completed Summary
  // ─────────────────────────────────────────────────────────────────────────
  if (completed) {
    return (
      <InterviewCompletion
        candidate={candidate}
        sessionId={sessionId}
        history={history}
        integrityStats={{ tabSwitches, focusLosses, pasteEvents, gazeAwayCount }}
        onReset={handleResetSession}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Pre-Launch Monitor Screen
  // ─────────────────────────────────────────────────────────────────────────
  if (!isMonitorLaunched) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-2 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/dashboard/candidates" className="hover:text-slate-800">Candidates</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/dashboard/candidates/${candidateId}`} className="hover:text-slate-800">{candidate?.name}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-slate-800">Interview Monitoring Center</span>
        </div>

        {/* Hero Card */}
        <Card className="p-8 border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-xs">
                {candidate?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{candidate?.name}</h1>
                <p className="text-xs text-slate-500 mt-0.5">{candidate?.position} · Trust Score: <span className="font-bold text-indigo-600">{candidate?.trust_score}/100</span></p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={candidate?.overall_status === 'verified' ? 'verified' : candidate?.overall_status === 'critical_review' ? 'critical' : 'warning'}>
                    {candidate?.overall_status?.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">ID: {candidate?.id}</span>
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="flex flex-col sm:items-end gap-2">
              <Button
                size="lg"
                variant="primary"
                onClick={handleLaunchMonitor}
                disabled={isLaunching}
                icon={Play}
                className="shadow-sm bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 font-semibold text-sm"
              >
                {isLaunching ? 'Connecting Monitor…' : 'Launch Interview Monitor'}
              </Button>
              {launchError && <p role="alert" className="max-w-sm text-xs text-rose-700">{launchError}</p>}
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Live Camera & Eye Gaze Proctoring Ready
              </span>
            </div>
          </div>

          {/* Architecture / Role Division Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wide">
                <Shield className="w-4 h-4 text-indigo-600" />
                HR Monitoring Center (This Window)
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Real-time <strong>Camera & Eye Movement</strong> gaze deviation tracking</li>
                <li><strong>HR Camera Tile</strong> broadcast preview with mic/video controls</li>
                <li><strong>Resume-based Question Generator</strong> targeting candidate skills</li>
                <li>Live Whisper transcription of candidate microphone feed</li>
                <li>Automated <strong>AI-Generated Answer Detection</strong> (0–100% LLM score)</li>
              </ul>
            </div>

            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-indigo-900 font-semibold text-xs uppercase tracking-wide">
                  <Video className="w-4 h-4 text-indigo-600" />
                  Candidate Interview Room
                </span>
                <Link
                  href={invitationUrl || '/candidate/interview'}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-semibold"
                >
                  Open Candidate Portal <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The candidate joins through the invitation URL for backend session <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700 font-mono text-[11px]">{sessionId || 'created when launched'}</code>.
                They see the HR interviewer's camera tile, read dispatched questions, and record answers via microphone.
              </p>
              <div className="pt-1">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono font-medium">
                  {sessionId ? 'Shared session invitation ready' : 'Launch the interview to create an invitation'}
                </span>
              </div>
              {invitationUrl && <div className="flex gap-2 pt-2">
                <input readOnly value={invitationUrl} aria-label="Candidate invitation URL" className="min-w-0 flex-1 rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-[11px] text-slate-700" />
                <Button variant="secondary" size="sm" onClick={copyInvitation}>{inviteCopied ? 'Copied' : 'Copy link'}</Button>
              </div>}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Active HR Interview Monitor
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-[1600px] min-h-[620px] flex-col gap-[13px] overflow-hidden">
      <div className="sticky top-0 z-30 flex shrink-0 flex-wrap items-center justify-between gap-[13px] rounded-xl border border-slate-200 bg-white px-[21px] py-[13px] shadow-xs">
        <div className="flex items-center gap-[13px]">
          <Link href={`/dashboard/candidates/${candidateId}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Back to candidate">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{candidate?.name}</h2>
              <Badge variant={candidate?.overall_status === 'verified' ? 'verified' : 'critical'}>{candidate?.overall_status?.replace('_', ' ')}</Badge>
            </div>
            <p className="text-xs text-slate-500">{candidate?.position} · Session #{sessionId.slice(-6)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-bold text-slate-700"><Clock className="h-4 w-4 text-slate-500" />{formatDuration(sessionDuration)}</div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />Live Monitor Active</div>
          <div className={`rounded-full border px-3 py-2 text-xs font-semibold ${gazeAssessment.status === 'high' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : gazeAssessment.status === 'low' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>Integrity: {gazeAssessment.status === 'high' ? 'HIGH' : gazeAssessment.status === 'low' ? 'LOW' : 'WAITING'}</div>
          <Link href={invitationUrl || '/candidate/interview'} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">Candidate Room <ExternalLink className="h-3.5 w-3.5" /></Link>
          <Button variant="danger" size="sm" onClick={() => setShowEndModal(true)} className="min-h-11">End Session</Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-[21px] overflow-y-auto lg:grid-cols-[1.618fr_1fr] lg:overflow-hidden">
        <section className="flex min-h-0 flex-col gap-[13px]" aria-label="Candidate Monitor">
          <div className="relative shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
            <CameraMonitorPanel
              active={isMonitorLaunched}
              gazeStatus={gazeAssessment.status}
              attentionPct={gazeAssessment.attentionPct}
              faceDetected={gazeAssessment.faceDetected}
              candidateName={candidate?.name}
              overlay
            />
            <HRCameraTile
              mode="hr"
              interviewerName="Lead Technical Recruiter"
              interviewerRole="TrustHire Evaluation Panel"
              compact
              className="absolute bottom-[13px] right-[13px] z-20 w-[200px] shadow-xl"
            />
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Integrity Signals">
            <div className="rounded-xl border border-slate-200 bg-white p-[13px]">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Eye Look-Aways</span>
              <span className={`text-lg font-bold ${gazeAwayCount >= 3 ? 'text-rose-600' : gazeAwayCount ? 'text-amber-600' : 'text-emerald-700'}`}>{gazeAwayCount}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-[13px]">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tab Switches</span>
              <span className={`text-lg font-bold ${tabSwitches >= 3 ? 'text-rose-600' : tabSwitches ? 'text-amber-600' : 'text-emerald-700'}`}>{tabSwitches}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-[13px]">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Gaze</span>
              <span className={`text-lg font-bold ${gazeAssessment.status === 'low' ? 'text-rose-600' : gazeAssessment.status === 'high' ? 'text-emerald-700' : 'text-slate-500'}`}>{gazeAssessment.attentionPct ?? '—'}{gazeAssessment.attentionPct !== null ? '%' : ''}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-[13px]">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">AI Pattern Score</span>
              <span className={`text-lg font-bold ${(latestAnswer?.aiScore ?? 0) >= 40 ? 'text-rose-600' : latestAnswer?.aiScore ? 'text-amber-600' : 'text-slate-500'}`}>{latestAnswer?.aiScore ?? '—'}{latestAnswer?.aiScore != null ? '/100' : ''}</span>
            </div>
          </div>

          <details className="relative shrink-0 self-end text-right">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100">Dev tools</summary>
            <div className="absolute z-30 mt-1 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-lg">
              <button onClick={() => { setTabSwitches((c) => c + 1); addIntegrityEvent({ eventType: 'tab_switch', severity: tabSwitches + 1 >= 4 ? 'critical' : 'high', timestamp: new Date().toISOString(), metadata: { count: tabSwitches + 1 } }); }} className="min-h-11 rounded-lg px-3 text-left text-xs text-slate-600 hover:bg-slate-50">+ Test Tab Switch</button>
              <button onClick={() => { setGazeAwayCount((c) => c + 1); addIntegrityEvent({ eventType: 'gaze_away', severity: 'medium', timestamp: new Date().toISOString(), metadata: { gaze_away_count: gazeAwayCount + 1 } }); }} className="min-h-11 rounded-lg px-3 text-left text-xs text-slate-600 hover:bg-slate-50">+ Test Look-Away</button>
            </div>
          </details>
        </section>

        <section className="flex h-[calc(100dvh-9rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:h-auto lg:min-h-0" aria-label="Interview Control">
          <div className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-slate-50/80" role="tablist" aria-label="Interview tools">
            {COPILOT_TABS.map(({ id, label, Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={copilotTab === id} onClick={() => setCopilotTab(id)} className={`flex min-h-12 shrink-0 items-center justify-center gap-2 border-b-2 px-[13px] text-xs font-semibold transition-colors ${copilotTab === id ? 'border-indigo-600 bg-white text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icon className="h-4 w-4" /><span>{label}</span>{id === 'integrity' && integrityEvents.length > 0 && <span className="rounded-full bg-slate-200 px-1.5 text-[10px]">{integrityEvents.length}</span>}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-[21px]" role="tabpanel">
            {copilotTab === 'live' && (
              <div className="space-y-[13px]">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Current Active Question (Live in Candidate Room)</span>
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">{currentCategory}</span>
                  </div>
                  <AIQuestionCard question={currentQuestion} questionNumber={questionIndex} totalQuestions={questionQueue.length} category={currentCategory} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Candidate Response & AI Speech Analysis</span>
                    <button type="button" onClick={() => handleDispatchQuestion(currentQuestion, currentCategory)} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50"><RefreshCw className="h-3.5 w-3.5" />Simulate Re-Answer</button>
                  </div>
                  <CandidateAnswerReview currentQuestion={currentQuestion} candidateAnswer={latestAnswer} isCandidateSpeaking={isCandidateSpeaking} showActions={false} />
                </div>
                {history.length > 0 && <Card className="p-[13px] shadow-xs border-slate-200"><CardTitle className="mb-3 text-xs uppercase tracking-wide text-slate-500">Completed Questions Transcript ({history.length})</CardTitle><InterviewHistory history={history} /></Card>}
              </div>
            )}

            {copilotTab === 'resume' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-700">Resume Skills & Projects Scanner</span><span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">Profile Scanned</span></div>
                <p className="text-xs leading-relaxed text-slate-500">Click Ask next to a skill or project to generate and dispatch a question live.</p>
                <ResumeQuestionGenerator sessionId={sessionId} candidateId={candidateId} onAskQuestion={(q) => handleDispatchQuestion(q, 'resume-probe')} />
                <p className="pt-1 text-center font-mono text-[10px] text-slate-400">Endpoint: POST /api/interviews/questions/from-resume</p>
              </div>
            )}

            {copilotTab === 'questions' && (
              <div className="space-y-3">
                <span className="block border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-700">AI Question Bank (Gemma / LLM)</span>
                <AIQuestionAssistant suggestions={questionSuggestions} loading={isGeneratingQuestion} error={questionError} onGenerate={generateGemmaQuestion} onSelectQuestion={(q) => handleDispatchQuestion(q)} />
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">Question order</span><span className="text-[10px] text-slate-500">Reorder, then dispatch</span></div>
                  {questionQueue.map((item, index) => <div key={item.question_id || `${item.question}-${index}`} className="flex items-center gap-1.5 rounded-lg border border-slate-100 p-2"><span className="w-5 shrink-0 text-xs text-slate-400">{index + 1}</span><span className="min-w-0 flex-1 text-xs text-slate-700">{item.question}</span><button aria-label="Move question up" disabled={index === 0} onClick={() => moveQueuedQuestion(index, -1)} className="min-h-11 min-w-11 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">↑</button><button aria-label="Move question down" disabled={index === questionQueue.length - 1} onClick={() => moveQueuedQuestion(index, 1)} className="min-h-11 min-w-11 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">↓</button><button disabled={isDispatchingQuestion} onClick={() => handleDispatchQuestion(item.question, item.category, item.question_id)} className="min-h-11 shrink-0 rounded bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 disabled:opacity-50">Ask now</button></div>)}
                  {questionError && <p role="alert" className="text-xs text-rose-700">{questionError}</p>}
                </div>
              </div>
            )}

            {copilotTab === 'documents' && <div className="space-y-3"><span className="block border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Document Discrepancy Cross-Check</span><DocumentConsistencyPanel candidateId={candidateId} /></div>}

            {copilotTab === 'integrity' && <div className="space-y-3"><span className="block border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Live Integrity Logs</span><IntegrityMonitorPanel events={integrityEvents} tabSwitches={tabSwitches} typingDetections={typingDetections} focusLosses={focusLosses} pasteEvents={pasteEvents} screenSharing={screenSharing} sessionActive={isMonitorLaunched} /></div>}
          </div>

          <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-200 bg-white p-[13px] shadow-[0_-8px_20px_rgba(15,23,42,0.06)]">
            <label htmlFor="custom-follow-up-question" className="mb-2 block text-xs font-bold text-slate-700">Ask Spontaneous / Custom Follow-Up Question</label>
            <div className="flex gap-2">
              <input id="custom-follow-up-question" type="text" value={customQuestionInput} onChange={(e) => setCustomQuestionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDispatchQuestion(customQuestionInput, 'follow-up')} placeholder="Type a question to send to the candidate…" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <Button size="sm" variant="primary" onClick={() => handleDispatchQuestion(customQuestionInput, 'follow-up')} disabled={!customQuestionInput.trim() || isDispatchingQuestion} icon={Send} className="min-h-11 px-4">Push Question</Button>
            </div>
            {questionError && <p role="alert" className="mt-2 text-xs text-rose-700">{questionError}</p>}
            <div className="mt-2 flex items-center justify-between gap-2">
              <button type="button" onClick={handleFlagCurrentAnswer} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${isCurrentAnswerFlagged ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}><Flag className="h-4 w-4" />{isCurrentAnswerFlagged ? 'Flagged for Audit' : 'Flag as Suspicious'}</button>
              <Button size="sm" variant="primary" onClick={handleNextQuestion} disabled={isDispatchingQuestion} className="min-h-11 px-4">Dispatch Next Question</Button>
            </div>
          </div>
        </section>
      </div>

      {/* End Session Confirmation Modal */}
      {showEndModal && (
        <EndInterviewModal
          questionCount={history.length + (latestAnswer && lastArchivedAnswerIdRef.current !== latestAnswer.id ? 1 : 0)}
          onConfirm={() => {
            setShowEndModal(false);
            handleEndSession();
          }}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
}
