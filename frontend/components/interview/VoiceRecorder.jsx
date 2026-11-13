'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, Send, Loader2, AlertCircle, CheckCircle2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { analyzeResponseForAI } from '@/lib/interview/api';

// Voice recording states
const STATE = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  TRANSCRIBED: 'transcribed',
  ERROR: 'error',
};

export default function VoiceRecorder({ sessionId, questionId, stream, onTranscript, onSubmit, disabled }) {
  const [recState, setRecState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Reset when question changes
  useEffect(() => {
    setRecState(STATE.IDLE);
    setTranscript('');
    setTimer(0);
    setErrorMsg('');
    setAiAnalysis(null);
    setAudioChunks([]);
  }, [questionId]);

  const startTimer = () => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };
  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  const startRecording = useCallback(async () => {
    setErrorMsg('');
    setAiAnalysis(null);
    setTranscript('');
    chunksRef.current = [];

    try {
      let micStream = stream;
      if (!micStream) {
        setRecState(STATE.REQUESTING);
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) throw new Error('No microphone audio track is available.');
      const audioStream = new MediaStream(audioTracks);
      const audioMimeType = 'audio/webm;codecs=opus';
      const mr = new MediaRecorder(
        audioStream,
        MediaRecorder.isTypeSupported(audioMimeType) ? { mimeType: audioMimeType } : undefined
      );
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => handleRecordingStop(micStream);
      mr.start(250);

      mediaRecorderRef.current = mr;
      setTimer(0);
      startTimer();
      setRecState(STATE.RECORDING);
    } catch (err) {
      const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setErrorMsg(denied ? 'Microphone access denied. Please allow microphone in browser settings.' : `Could not start recording: ${err.message}`);
      setRecState(STATE.ERROR);
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
    setRecState(STATE.PROCESSING);
  }, []);

  const handleRecordingStop = useCallback(async (micStream) => {
    // Stop tracks only if we created this stream ourselves (not shared)
    if (!stream && micStream) {
      micStream.getTracks().forEach((t) => t.stop());
    }

    setRecState(STATE.PROCESSING);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

    // BACKEND INTEGRATION POINT: Upload blob to /api/interviews/{sessionId}/audio
    // For now we simulate transcription with a 1.5s delay
    await new Promise((r) => setTimeout(r, 1500));

    // Mock transcription — replace with real Whisper backend call
    const mockTranscripts = [
      "So, React reconciliation works through a virtual DOM diffing algorithm. When state changes, React creates a new virtual DOM tree and compares it with the previous one — this is the diffing step. It uses a heuristic approach assuming elements of different types produce different trees, so it can skip large subtree comparisons. Keys help it track list items across renders without re-mounting unnecessarily.",
      "I'd use useCallback when passing a function as a prop to a memoized child component, to prevent unnecessary re-renders. useMemo is for expensive computations — when the derived value is costly to recalculate. React.memo is at the component level and prevents re-rendering if props haven't changed. The common mistake is overusing them — memoization has its own cost.",
      "For state at scale, it really depends. Context is great for low-frequency updates like themes or auth state, but it re-renders every consumer on change which makes it bad for high-frequency state. Redux gives you predictability and time-travel debugging but adds boilerplate. Zustand is my current go-to — tiny bundle, minimal boilerplate, and you can subscribe to slices.",
    ];

    const mockText = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    setTranscript(mockText);
    if (onTranscript) onTranscript(mockText);
    setRecState(STATE.TRANSCRIBED);
  }, [stream, onTranscript]);

  const analyzeForAI = async () => {
    if (!transcript) return;
    setAiLoading(true);
    try {
      const result = await analyzeResponseForAI(sessionId, { transcript, questionId });
      setAiAnalysis(result);
    } catch {
      setAiAnalysis({ error: true });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) onSubmit({ transcript, aiAnalysis });
  };

  const reset = () => {
    setRecState(STATE.IDLE);
    setTranscript('');
    setTimer(0);
    setErrorMsg('');
    setAiAnalysis(null);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const aiVerdict = aiAnalysis?.verdict;
  const verdictConfig = {
    natural:    { label: 'Natural Speech', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    review:     { label: 'Review Needed',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
    likely_ai:  { label: 'Likely AI',      color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200' },
  };
  const vc = verdictConfig[aiVerdict] || {};

  return (
    <div className="space-y-3">
      {/* State: Idle / Error */}
      {(recState === STATE.IDLE || recState === STATE.ERROR) && (
        <div className="text-center py-6 space-y-3">
          {recState === STATE.ERROR && (
            <div className="flex items-center gap-2 justify-center text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <button
            onClick={startRecording}
            disabled={disabled}
            className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center mx-auto shadow-lg transition-all hover:scale-105 active:scale-95"
            aria-label="Start recording"
          >
            <Mic className="w-8 h-8" />
          </button>
          <p className="text-sm text-slate-500">Click to start recording your answer</p>
        </div>
      )}

      {/* State: Requesting permissions */}
      {recState === STATE.REQUESTING && (
        <div className="text-center py-6 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-600">Requesting microphone access…</p>
        </div>
      )}

      {/* State: Recording */}
      {recState === STATE.RECORDING && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-sm font-medium text-rose-700">Recording</span>
            </div>
            <span className="text-sm font-mono text-rose-700">{formatTime(timer)}</span>
          </div>
          {/* Waveform visualization (CSS only) */}
          <div className="flex items-center justify-center gap-0.5 h-12">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-indigo-400 rounded-full animate-pulse"
                style={{ height: `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 10}px`, animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={stopRecording}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-105"
              aria-label="Stop recording"
            >
              <Square className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">Speak clearly — click the square to stop</p>
        </div>
      )}

      {/* State: Processing */}
      {recState === STATE.PROCESSING && (
        <div className="text-center py-6 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-600">Processing audio…</p>
          <p className="text-xs text-slate-400">Transcribing with Whisper (backend integration point)</p>
        </div>
      )}

      {/* State: Transcribed */}
      {recState === STATE.TRANSCRIBED && (
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Transcription</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">{transcript}</p>
          </div>

          {/* AI Detection */}
          {!aiAnalysis && (
            <button
              onClick={analyzeForAI}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-indigo-300 transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {aiLoading ? 'Analyzing…' : 'Analyze for AI-generated content'}
            </button>
          )}

          {aiAnalysis && !aiAnalysis.error && (
            <div className={`border rounded-lg p-3 ${vc.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${vc.color}`}>
                  {vc.label || 'Analysis Complete'}
                </span>
                <span className={`text-sm font-bold ${vc.color}`}>{aiAnalysis.ai_score}/100</span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {Object.entries(aiAnalysis.signals || {}).map(([key, val]) => (
                  <div key={key} className="text-xs text-slate-600">
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                    <span className="text-slate-500">{val}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">{aiAnalysis.note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={reset} className="flex-1">
              <MicOff className="w-3.5 h-3.5" />
              Re-record
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} className="flex-1" icon={Send}>
              Submit Answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

