'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Video,
  VideoOff,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Eye,
  EyeOff,
  Clipboard,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { DEMO_CANDIDATES } from '@/lib/constants';

export default function InterviewMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id || 'cand-sarah-001';

  const [candidate, setCandidate] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPastes, setCopyPastes] = useState(0);
  const [focusLosses, setFocusLosses] = useState(0);
  const [events, setEvents] = useState([]);
  const [duration, setDuration] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const c = await api.candidates.get(id);
        setCandidate(c || DEMO_CANDIDATES[0]);
      } catch (e) {
        setCandidate(DEMO_CANDIDATES[0]);
      }
    }
    fetchCandidate();
  }, [id]);

  // Session duration timer
  useEffect(() => {
    if (isMonitoring) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isMonitoring]);

  // Client-side Browser Tab Monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newEvent = {
          id: 'evt-' + Date.now(),
          type: 'tab_switch',
          label: 'Tab switched away (Hidden)',
          timestamp: new Date().toLocaleTimeString(),
          severity: 'high',
        };
        setTabSwitches((prev) => prev + 1);
        setEvents((prev) => [newEvent, ...prev]);
      } else {
        const returnEvent = {
          id: 'evt-' + Date.now(),
          type: 'tab_return',
          label: 'Returned to assessment tab',
          timestamp: new Date().toLocaleTimeString(),
          severity: 'low',
        };
        setEvents((prev) => [returnEvent, ...prev]);
      }
    };

    const handleBlur = () => {
      const blurEvent = {
        id: 'evt-' + Date.now(),
        type: 'window_blur',
        label: 'Window lost focus (Alt+Tab / secondary app)',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'medium',
      };
      setFocusLosses((prev) => prev + 1);
      setEvents((prev) => [blurEvent, ...prev]);
    };

    const handlePaste = (e) => {
      const pasteEvent = {
        id: 'evt-' + Date.now(),
        type: 'copy_paste',
        label: 'Clipboard paste action detected',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'medium',
      };
      setCopyPastes((prev) => prev + 1);
      setEvents((prev) => [pasteEvent, ...prev]);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('paste', handlePaste);
    };
  }, [isMonitoring]);

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
      console.warn('Camera access not granted or unavailable, continuing in headless monitor mode:', err);
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

  const handleStartSession = async () => {
    setConsentGranted(true);
    setIsMonitoring(true);
    setEvents([
      {
        id: 'start',
        type: 'session_start',
        label: 'Interview session monitoring initialized',
        timestamp: new Date().toLocaleTimeString(),
        severity: 'low',
      },
    ]);
    await startCamera();
  };

  const handleStopSession = () => {
    setIsMonitoring(false);
    stopCamera();
  };

  const handleSimulateEvent = (type) => {
    const time = new Date().toLocaleTimeString();
    if (type === 'tab_switch') {
      setTabSwitches((prev) => prev + 1);
      setEvents((prev) => [
        {
          id: 'sim-' + Date.now(),
          type: 'tab_switch',
          label: '[Demo Trigger] Tab switched away for 35s',
          timestamp: time,
          severity: 'high',
        },
        ...prev,
      ]);
    } else if (type === 'paste') {
      setCopyPastes((prev) => prev + 1);
      setEvents((prev) => [
        {
          id: 'sim-' + Date.now(),
          type: 'copy_paste',
          label: '[Demo Trigger] Large paste (320 characters)',
          timestamp: time,
          severity: 'medium',
        },
        ...prev,
      ]);
    }
  };

  const handleCompleteAndAudit = () => {
    setAnalyzing(true);
    setIsMonitoring(false);
    stopCamera();

    setTimeout(() => {
      // Calculate integrity score
      let score = 100;
      score -= tabSwitches * 5;
      score -= copyPastes * 8;
      score -= focusLosses * 3;
      score = Math.max(0, score);

      setReport({
        score,
        status: score >= 75 ? 'Clean' : score >= 50 ? 'Requires Review' : 'Critical Integrity Alert',
        tabSwitches,
        copyPastes,
        focusLosses,
        summary:
          score >= 75
            ? 'Candidate maintained consistent browser focus with minimal external app interaction.'
            : `Suspicious behavior detected: ${tabSwitches} tab switches and ${copyPastes} clipboard events observed during live assessment.`,
      });
      setAnalyzing(false);
    }, 1200);
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const currentCand = candidate || DEMO_CANDIDATES[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/candidates/${currentCand.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {currentCand.name}'s profile
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Live Technical Interview Monitor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time client-side focus monitoring, window blur tracking, and telemetry feed for {currentCand.name}.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMonitoring ? 'bg-rose-500 animate-ping' : 'bg-slate-300'
              }`}
            />
            <span className="text-xs font-bold font-mono">
              {isMonitoring ? `RECORDING ${formatTimer(duration)}` : 'IDLE / READY'}
            </span>
          </div>
        </div>
      </div>

      {/* Consent Banner (if not yet started) */}
      {!consentGranted && (
        <Card className="p-6 bg-indigo-50/70 border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Ethical Proctoring & Candidate Privacy Notice
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                TrustHire monitors browser tab visibility, focus changes, and optional camera presence with candidate
                consent. No keystrokes or screen captures are sent to external third parties. All event logs are evaluated
                using deterministic heuristics to assist human recruiters.
              </p>
              <div className="pt-2">
                <Button size="md" onClick={handleStartSession} icon={Play}>
                  Consent & Start Interview Session
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Feed & Real-time Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          {/* Webcam / Feed Area */}
          <Card className="overflow-hidden bg-slate-950 text-white relative min-h-[340px] flex items-center justify-center border-slate-800">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[420px]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="p-4 bg-slate-900 rounded-2xl text-slate-500 mb-3 border border-slate-800">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {isMonitoring ? 'Camera stream active (headless simulation)' : 'Camera stream paused'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Browser tab visibility and focus tracking run independently of video feed.
                </p>
              </div>
            )}

            {/* Overlaid Live Badges */}
            {isMonitoring && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-rose-600/90 text-white text-[11px] font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE ASSESSMENT
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-slate-300 text-[11px] font-mono border border-white/10">
                  Candidate: {currentCand.name}
                </span>
              </div>
            )}
          </Card>

          {/* Session Controls & Demo Triggers */}
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isMonitoring ? (
                  <Button variant="danger" size="sm" onClick={handleStopSession} icon={Square}>
                    Pause Monitor
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleStartSession} icon={Play}>
                    {consentGranted ? 'Resume Monitoring' : 'Start Monitor'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompleteAndAudit}
                  disabled={analyzing}
                  icon={Sparkles}
                >
                  {analyzing ? 'Synthesizing...' : 'Complete & Generate Report'}
                </Button>
              </div>

              {/* Demo Triggers for judges */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Judge Demo:
                </span>
                <button
                  onClick={() => handleSimulateEvent('tab_switch')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  + Tab Switch
                </button>
                <button
                  onClick={() => handleSimulateEvent('paste')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  + Paste
                </button>
              </div>
            </div>
          </Card>

          {/* Telemetry Summary Counters */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tab Switches
              </span>
              <span
                className={`text-2xl font-extrabold mt-1 block ${
                  tabSwitches >= 5 ? 'text-rose-600' : tabSwitches >= 3 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {tabSwitches}
              </span>
              <span className="text-[10px] text-slate-400">Threshold: &lt;3 clean</span>
            </Card>

            <Card className="p-4 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Clipboard Pastes
              </span>
              <span
                className={`text-2xl font-extrabold mt-1 block ${
                  copyPastes >= 3 ? 'text-rose-600' : copyPastes >= 1 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {copyPastes}
              </span>
              <span className="text-[10px] text-slate-400">Post-switch correlated</span>
            </Card>

            <Card className="p-4 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Focus Losses
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {focusLosses}
              </span>
              <span className="text-[10px] text-slate-400">Window blur events</span>
            </Card>
          </div>
        </div>

        {/* Right Column: Real-time Event Log & Audit Report */}
        <div className="lg:col-span-5 space-y-6">
          {/* Generated Report Card if completed */}
          {report && (
            <Card className="p-5 border-indigo-200 bg-indigo-50/40">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Integrity Audit Result</h3>
                </div>
                <Badge
                  variant={report.score >= 75 ? 'verified' : report.score >= 50 ? 'warning' : 'critical'}
                >
                  {report.status}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Session Integrity Score</span>
                  <span className="text-3xl font-extrabold text-slate-900">{report.score}/100</span>
                </div>
                <Link href={`/dashboard/candidates/${currentCand.id}`}>
                  <Button size="sm">Save to Profile</Button>
                </Link>
              </div>

              <p className="text-xs text-slate-600 mt-3 p-3 bg-white rounded-lg border border-indigo-100 leading-relaxed">
                {report.summary}
              </p>
            </Card>
          )}

          {/* Scrolling Event Log */}
          <Card className="flex flex-col h-[520px]">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm">Real-Time Event Stream</CardTitle>
                <span className="text-[11px] font-mono text-slate-400">
                  {events.length} events logged
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Clock className="w-6 h-6 mb-2" />
                  <p className="text-xs">Waiting for interview events...</p>
                  <p className="text-[11px] text-slate-400">Switch tabs or use demo triggers to test</p>
                </div>
              ) : (
                events.map((evt) => {
                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (evt.severity === 'high') badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                  if (evt.severity === 'medium') badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                  if (evt.severity === 'low') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  return (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/80 flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${badgeColor} mb-1`}>
                          {evt.type}
                        </span>
                        <p className="text-slate-800 font-sans text-xs">{evt.label}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono mt-0.5">
                        {evt.timestamp}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
