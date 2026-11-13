'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Video, VideoOff, Mic, MicOff, Shield, AlertTriangle,
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
  const [currentCategory, setCurrentCategory] = useState('opening');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [questionSuggestions, setQuestionSuggestions] = useState([]);
  const [questionError, setQuestionError] = useState('');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isDispatchingQuestion, setIsDispatchingQuestion] = useState(false);
  const [history, setHistory] = useState([]);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
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
  const [copilotTab, setCopilotTab] = useState('resume');

  const timerRef = useRef(null);
  const lastGazeStatusRef = useRef(null);
  const lastAnswerSignatureRef = useRef(null);
  const lastQuestionVersionRef = useRef(0);
  const lastArchivedAnswerIdRef = useRef(null);

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
          setCurrentCategory(latestSubmittedAnswer.category || 'general');
          setIsCandidateSpeaking(false);
        }
        const activeQuestion = session.current_question;
        if (activeQuestion && activeQuestion.version > lastQuestionVersionRef.current) {
          lastQuestionVersionRef.current = activeQuestion.version;
          setCurrentQuestion(activeQuestion.question);
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
      } catch {
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
      setQuestionQueue(initialQueue);
      if (initialSession.current_question) {
        setCurrentQuestion(initialSession.current_question.question);
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
      setCurrentCategory(dispatched.category);
      setQuestionIndex(dispatched.version);
      lastQuestionVersionRef.current = dispatched.version;
      if (!questionQueue.some((item) => item.question_id === dispatched.question_id)) {
        await persistQuestionQueue([...questionQueue, {
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
    setQuestionQueue(nextQueue);
    if (!sessionId) return;
    try {
      await saveInterviewQuestionQueue(sessionId, nextQueue);
      setQuestionError('');
    } catch (error) {
      setQuestionError(error.message || 'Could not save the question order.');
    }
  };

  const moveQueuedQuestion = (index, offset) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= questionQueue.length) return;
    const nextQueue = [...questionQueue];
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
      await persistQuestionQueue([...questionQueue, queued]);
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
  // RENDER: Active HR Interview Monitor Screen (Rock-Solid 2-Column Layout)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 w-full max-w-7xl mx-auto pb-10">
      {/* Top Session Status Bar Card - Spans 100% of width cleanly */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Candidate Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
            {candidate?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{candidate?.name}</h2>
              <Badge variant={candidate?.overall_status === 'verified' ? 'verified' : 'critical'}>
                {candidate?.overall_status?.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">{candidate?.position} · Session #{sessionId.slice(-6)}</p>
          </div>
        </div>

        {/* Live Status Indicators & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Timer */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-xs font-bold text-slate-700">{formatDuration(sessionDuration)}</span>
          </div>

          {/* Proctoring Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Monitor Active
          </div>

          {/* Overall Integrity Score */}
          <div className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border ${
            gazeAssessment.status === 'high'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : gazeAssessment.status === 'low'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            Integrity: {gazeAssessment.status === 'high' ? 'HIGH' : gazeAssessment.status === 'low' ? 'LOW' : 'WAITING'}
          </div>

          {/* Candidate Room Link */}
          <Link
            href={invitationUrl || '/candidate/interview'}
            target="_blank"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Candidate Room <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* End Session Button */}
          <Button variant="danger" size="sm" onClick={() => setShowEndModal(true)}>
            End Session
          </Button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout (5 cols left, 7 cols right on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* ── LEFT COLUMN: Dual Videos, Proctoring & HR Copilot Tools (5 cols) ── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Dual Live Video Monitoring Feeds */}
          <Card className="p-4 space-y-4 shadow-xs border-slate-200">
            {/* Tile A: Candidate Live Feed with Eye Movement Tracking */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  Candidate Eye Gaze Monitor
                </span>
                <span className="text-[10px] text-slate-400 font-mono">WebRTC Feed</span>
              </div>

              <CameraMonitorPanel
                active={isMonitorLaunched}
                gazeStatus={gazeAssessment.status}
                attentionPct={gazeAssessment.attentionPct}
                faceDetected={gazeAssessment.faceDetected}
                candidateName={candidate?.name}
              />
            </div>

            {/* Tile B: HR Interviewer Camera (Self-Preview & Broadcast) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-600" />
                  HR Interviewer Camera
                </span>
                <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Broadcasting
                </span>
              </div>

              <HRCameraTile
                mode="hr"
                interviewerName="Lead Technical Recruiter"
                interviewerRole="TrustHire Evaluation Panel"
              />
            </div>

            {/* Proctoring Telemetry Summary & Test Triggers */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-slate-400 text-[10px] block uppercase font-medium">Eye Look-Aways</span>
                  <span className={`text-base font-bold ${gazeAwayCount >= 3 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {gazeAwayCount} <span className="text-[11px] font-normal text-slate-400">events</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-slate-400 text-[10px] block uppercase font-medium">Tab Switches</span>
                  <span className={`text-base font-bold ${tabSwitches >= 3 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {tabSwitches} <span className="text-[11px] font-normal text-slate-400">switches</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-slate-400 text-[10px] block uppercase font-medium">Typing Bursts</span>
                  <span className={`text-base font-bold ${typingDetections ? 'text-amber-600' : 'text-slate-700'}`}>
                    {typingDetections} <span className="text-[11px] font-normal text-slate-400">detected</span>
                  </span>
                </div>
              </div>

              {/* Demo Test Simulation Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setTabSwitches((c) => c + 1);
                    addIntegrityEvent({
                      eventType: 'tab_switch',
                      severity: tabSwitches + 1 >= 4 ? 'critical' : 'high',
                      timestamp: new Date().toISOString(),
                      metadata: { count: tabSwitches + 1 },
                    });
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  + Test Tab Switch
                </button>

                <button
                  onClick={() => {
                    setGazeAwayCount((c) => c + 1);
                    addIntegrityEvent({
                      eventType: 'gaze_away',
                      severity: 'medium',
                      timestamp: new Date().toISOString(),
                      metadata: { gaze_away_count: gazeAwayCount + 1 },
                    });
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                >
                  + Test Look-Away
                </button>
              </div>
            </div>
          </Card>

          {/* Card 2: HR Copilot & Question Generator Tools */}
          <Card className="shadow-xs border-slate-200 overflow-hidden">
            {/* Copilot Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
              {COPILOT_TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setCopilotTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                    copilotTab === id
                      ? 'border-indigo-600 text-indigo-700 bg-white font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {id === 'integrity' && integrityEvents.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 font-bold">
                      {integrityEvents.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content Panel */}
            <div className="p-4 space-y-4">
              {/* 1. Resume Scanner & Question Generator */}
              {copilotTab === 'resume' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Resume Skills & Projects Scanner
                    </span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                      Profile Scanned
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Click <strong>"Ask"</strong> next to any skill or project below to generate an AI technical question and dispatch it live to the candidate portal.
                  </p>
                  <ResumeQuestionGenerator
                    sessionId={sessionId}
                    candidateId={candidateId}
                    onAskQuestion={(q) => handleDispatchQuestion(q, 'resume-probe')}
                  />
                </div>
              )}

              {/* 2. AI Question Assistant */}
              {copilotTab === 'questions' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block pb-1 border-b border-slate-100">
                    AI Question Bank (Gemma / LLM)
                  </span>
                  <AIQuestionAssistant
                    suggestions={questionSuggestions}
                    loading={isGeneratingQuestion}
                    error={questionError}
                    onGenerate={generateGemmaQuestion}
                    onSelectQuestion={(q) => handleDispatchQuestion(q)}
                  />
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Question order</span>
                      <span className="text-[10px] text-slate-500">Reorder, then dispatch any item</span>
                    </div>
                    {questionQueue.map((item, index) => (
                      <div key={item.question_id || `${item.question}-${index}`} className="flex items-center gap-1.5 rounded-lg border border-slate-100 p-2">
                        <span className="w-5 shrink-0 text-[10px] text-slate-400">{index + 1}</span>
                        <span className="min-w-0 flex-1 text-xs text-slate-700">{item.question}</span>
                        <button aria-label="Move question up" disabled={index === 0} onClick={() => moveQueuedQuestion(index, -1)} className="rounded px-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↑</button>
                        <button aria-label="Move question down" disabled={index === questionQueue.length - 1} onClick={() => moveQueuedQuestion(index, 1)} className="rounded px-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30">↓</button>
                        <button disabled={isDispatchingQuestion} onClick={() => handleDispatchQuestion(item.question, item.category, item.question_id)} className="shrink-0 rounded bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 disabled:opacity-50">Ask now</button>
                      </div>
                    ))}
                    {questionError && <p role="alert" className="text-xs text-rose-700">{questionError}</p>}
                  </div>
                </div>
              )}

              {/* 3. Document Consistency & Verification Red Flags */}
              {copilotTab === 'documents' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block pb-1 border-b border-slate-100">
                    Document Discrepancy Cross-Check
                  </span>
                  <DocumentConsistencyPanel candidateId={candidateId} />
                </div>
              )}

              {/* 4. Background Integrity Event Feed */}
              {copilotTab === 'integrity' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block pb-1 border-b border-slate-100">
                    Live Integrity Logs
                  </span>
                  <IntegrityMonitorPanel
                    events={integrityEvents}
                    tabSwitches={tabSwitches}
                    typingDetections={typingDetections}
                    focusLosses={focusLosses}
                    pasteEvents={pasteEvents}
                    screenSharing={screenSharing}
                    sessionActive={isMonitorLaunched}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: Active Q&A, Voice Transcription & AI Content Detection (7 cols) ── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Question Dispatched to Candidate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Current Active Question (Live in Candidate Room)
              </span>
              <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-medium capitalize">
                {currentCategory}
              </span>
            </div>

            <AIQuestionCard
              question={currentQuestion}
              questionNumber={questionIndex}
              totalQuestions={questionQueue.length}
              category={currentCategory}
            />
          </div>

          {/* Candidate Voice Feed Review & AI Speech Detection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                Candidate Voice Feed & AI Speech Analysis
              </span>
              <button
                onClick={() => handleDispatchQuestion(currentQuestion, currentCategory)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Simulate Re-Answer
              </button>
            </div>

            <CandidateAnswerReview
              currentQuestion={currentQuestion}
              candidateAnswer={latestAnswer}
              isCandidateSpeaking={isCandidateSpeaking}
              onFlagAnswer={(flagged) => {
                addIntegrityEvent({
                  eventType: 'manual_hr_flag',
                  severity: 'high',
                  timestamp: new Date().toISOString(),
                  metadata: { reason: 'HR flagged response for review', question: currentQuestion },
                });
              }}
              onNextQuestion={() => {
                const currentIndex = questionQueue.findIndex((question) => question.question === currentQuestion);
                const nextQuestion = questionQueue[currentIndex + 1] || questionQueue.find((question) => question.question !== currentQuestion);
                if (nextQuestion) handleDispatchQuestion(nextQuestion.question, nextQuestion.category, nextQuestion.question_id);
                else setQuestionError('Add or generate another question before continuing.');
              }}
            />
          </div>

          {/* Custom Follow-Up Question Dispatcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Ask Spontaneous / Custom Follow-Up Question
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customQuestionInput}
                onChange={(e) => setCustomQuestionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDispatchQuestion(customQuestionInput, 'follow-up')}
                placeholder="Type question to push live to the candidate's screen..."
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleDispatchQuestion(customQuestionInput, 'follow-up')}
                disabled={!customQuestionInput.trim()}
                icon={Send}
                className="px-4"
              >
                Push Question
              </Button>
            </div>
          </div>

          {/* Transcript History */}
          {history.length > 0 && (
            <Card className="p-4 shadow-xs border-slate-200">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 mb-3">
                Completed Questions Transcript ({history.length})
              </CardTitle>
              <InterviewHistory history={history} />
            </Card>
          )}
        </div>
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
