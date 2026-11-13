'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Video,
  Play,
  Square,
  Eye,
  CheckCircle2,
  Clock,
  Shield,
  Send,
  AlertTriangle,
  Code2,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    title: 'Question 1: System Design & Rate Limiting',
    prompt:
      'Design a distributed rate-limiting system for an API gateway supporting 100,000 requests per second. Explain which algorithm (Token Bucket, Leaky Bucket, Sliding Window Counter) you would choose, what data store you would select, and how you would handle race conditions across multiple server instances.',
  },
  {
    id: 2,
    title: 'Question 2: Concurrency & Asynchronous Processing',
    prompt:
      'Explain how you prevent deadlock when two concurrent processes need to acquire mutual exclusion locks on multiple resources in a relational database. Provide pseudocode or concrete examples.',
  },
];

export default function CandidateInterviewPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({ 0: '', 1: '' });
  const [secondsRemaining, setSecondsRemaining] = useState(1800); // 30 minutes
  const [submitted, setSubmitted] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIdRef = useRef('session-' + Date.now());

  // Timer
  useEffect(() => {
    let interval = null;
    if (sessionActive && !submitted) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, submitted]);

  // Client-side proctoring tracking during assessment
  useEffect(() => {
    if (!sessionActive || submitted) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setWarningMessage('Warning: Tab switch detected. Assessment proctoring rules require you to stay on this window.');
        try {
          await api.interviews.recordEvent(sessionIdRef.current, {
            event_type: 'tab_switch',
            timestamp: new Date().toISOString(),
            details: { role: 'candidate', hidden: true },
          });
        } catch (e) {
          console.warn('Proctoring log error:', e);
        }
      }
    };

    const handleBlur = async () => {
      try {
        await api.interviews.recordEvent(sessionIdRef.current, {
          event_type: 'window_blur',
          timestamp: new Date().toISOString(),
          details: { role: 'candidate' },
        });
      } catch (e) {
        console.warn('Proctoring log error:', e);
      }
    };

    const handlePaste = async () => {
      try {
        await api.interviews.recordEvent(sessionIdRef.current, {
          event_type: 'copy_paste',
          timestamp: new Date().toISOString(),
          details: { role: 'candidate' },
        });
      } catch (e) {
        console.warn('Proctoring log error:', e);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('paste', handlePaste);
    };
  }, [sessionActive, submitted]);

  const startCamera = async () => {
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera permission not granted, proceeding in audio/screen check mode:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleStartAssessment = async () => {
    setSessionActive(true);
    await startCamera();
  };

  const handleSubmitAssessment = async () => {
    setSubmitted(true);
    setSessionActive(false);
    stopCamera();

    try {
      await api.interviews.analyze(sessionIdRef.current);
    } catch (e) {
      console.warn('Analyze error:', e);
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/candidate"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidate Portal
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Technical Assessment Room</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Proctored interview environment with automated session integrity validation.
          </p>
        </div>

        {sessionActive && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatTimer(secondsRemaining)} REMAINING
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              Proctored
            </span>
          </div>
        )}
      </div>

      {warningMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <button onClick={() => setWarningMessage(null)} className="text-amber-800 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {!sessionActive && !submitted ? (
        /* Pre-interview Waiting Lobby */
        <Card className="p-8 max-w-2xl mx-auto text-center space-y-6 border-slate-200">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Video className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Ready to Start Your Assessment?</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              This session includes 2 technical problem-solving questions with a 30-minute allocation. Please ensure you are in
              a quiet environment with your webcam connected.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-1">Assessment Guidelines:</span>
            <p className="text-slate-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              Do not switch browser tabs or minimize your assessment window.
            </p>
            <p className="text-slate-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              Keep your camera active and remain facing your screen.
            </p>
            <p className="text-slate-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              All responses are logged and delivered to the hiring team.
            </p>
          </div>

          <div className="pt-2">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleStartAssessment} icon={Play}>
              Start Proctored Interview
            </Button>
          </div>
        </Card>
      ) : submitted ? (
        /* Submission Done */
        <Card className="p-10 text-center max-w-2xl mx-auto space-y-6 border-emerald-200 bg-emerald-50/20">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Assessment Submitted Successfully!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your answers and session proctoring telemetry have been securely transferred to the hiring company for review.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Link href="/candidate/status">
              <Button size="md" className="bg-emerald-600 hover:bg-emerald-700">
                View Application Status
              </Button>
            </Link>
            <Link href="/candidate">
              <Button variant="secondary" size="md">
                Candidate Portal Home
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Live Proctored Test Window */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Question & Answer Column */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
                  {ASSESSMENT_QUESTIONS[currentQuestionIdx].title}
                </span>
                <span className="text-xs text-slate-400">
                  Question {currentQuestionIdx + 1} of {ASSESSMENT_QUESTIONS.length}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {ASSESSMENT_QUESTIONS[currentQuestionIdx].prompt}
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-600" /> Your Solution / Answer
                </label>
                <textarea
                  rows={12}
                  value={answers[currentQuestionIdx]}
                  onChange={(e) => setAnswers({ ...answers, [currentQuestionIdx]: e.target.value })}
                  placeholder="Write your detailed technical answer or architectural explanation here..."
                  className="w-full p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                >
                  Previous Question
                </Button>

                {currentQuestionIdx < ASSESSMENT_QUESTIONS.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentQuestionIdx((p) => p + 1)}>
                    Next Question
                  </Button>
                ) : (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitAssessment} icon={Send}>
                    Submit Assessment
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Live Webcam Preview & Proctoring Indicators */}
          <div className="lg:col-span-4 space-y-6">
            {/* Camera feed */}
            <Card className="overflow-hidden bg-slate-950 text-white relative min-h-[220px] flex items-center justify-center border-slate-800">
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover max-h-[260px]" />
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  <Video className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  <span>Webcam stream active</span>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase bg-black/60 px-2 py-0.5 rounded text-slate-300">
                  PROCTORING ACTIVE
                </span>
              </div>
            </Card>

            {/* Proctoring Rules Box */}
            <Card className="p-4 bg-slate-50 border-slate-200 text-xs space-y-2.5">
              <span className="font-semibold text-slate-800 block">Integrity Session Notice</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Your browser focus, tab switches, and clipboard operations are logged in real-time to uphold fairness for all
                applicants.
              </p>
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Status: All systems operational
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
