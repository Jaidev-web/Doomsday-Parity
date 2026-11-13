'use client';

import { useState } from 'react';
import {
  Bot, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Volume2,
  RefreshCw, Flag, MessageSquare, Clock, HelpCircle, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CandidateAnswerReview({
  currentQuestion,
  candidateAnswer,
  isCandidateSpeaking,
  onFlagAnswer,
  onNextQuestion,
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [localFlagged, setLocalFlagged] = useState(false);

  // If no answer yet and candidate isn't speaking
  if (!candidateAnswer && !isCandidateSpeaking) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Waiting for Candidate Answer</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Once the candidate speaks into their microphone in the Candidate Room, their transcribed response and real-time AI speech analysis will appear here.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Microphone stream connected</span>
        </div>
      </div>
    );
  }

  // When candidate is actively speaking
  if (isCandidateSpeaking) {
    return (
      <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 font-mono">
              Candidate Speaking (Live Audio Feed)
            </span>
          </div>
          <span className="text-xs text-indigo-600 font-medium">Whisper ASR Streaming</span>
        </div>

        {/* Live Audio Waveform Simulation */}
        <div className="flex items-center justify-center gap-1 h-12 bg-white/70 border border-indigo-100 rounded-xl p-2">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-indigo-500 rounded-full animate-pulse"
              style={{
                height: `${14 + Math.sin(i * 0.7) * 22 + (i % 3) * 6}px`,
                animationDelay: `${(i % 5) * 0.1}s`,
              }}
            />
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center italic">
          Listening to microphone input from candidate portal...
        </p>
      </div>
    );
  }

  // Answer received — display transcript & AI analysis
  const aiScore = candidateAnswer.aiScore ?? 28;
  const isLikelyAI = aiScore > 60;
  const isSuspicious = aiScore >= 35 && aiScore <= 60;

  const verdictConfig = isLikelyAI
    ? {
        label: 'High Probability AI Generated',
        color: 'text-rose-700',
        bg: 'bg-rose-50 border-rose-300',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: ShieldAlert,
      }
    : isSuspicious
    ? {
        label: 'Inconclusive / Review Required',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-300',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: AlertTriangle,
      }
    : {
        label: 'Natural Spoken Response',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: CheckCircle2,
      };

  const VIcon = verdictConfig.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-0">
      {/* Header bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            A
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Candidate Response (Microphone Transcription)
            </h4>
            <p className="text-[11px] text-slate-400">Captured via Whisper STT · {candidateAnswer.timestamp || 'Just now'}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${verdictConfig.badge}`}>
          <VIcon className="w-3.5 h-3.5" />
          <span>AI Score: {aiScore}%</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Answer Text */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
          <p className="text-sm text-slate-800 leading-relaxed font-sans">
            "{candidateAnswer.text}"
          </p>
        </div>

        {/* AI Detection Breakdown Box */}
        <div className={`rounded-xl border p-4 ${verdictConfig.bg} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className={`w-4 h-4 ${verdictConfig.color}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${verdictConfig.color}`}>
                AI Speech Detection Analysis
              </span>
            </div>
            <span className={`text-xs font-semibold ${verdictConfig.color}`}>
              {verdictConfig.label}
            </span>
          </div>

          {/* Signal checks grid */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vocabulary Complexity</span>
              <span className={`font-semibold ${isLikelyAI ? 'text-rose-600' : 'text-slate-700'}`}>
                {candidateAnswer.signals?.vocabulary || (isLikelyAI ? 'Unusually high / Textbook level' : 'Normal colloquial')}
              </span>
            </div>

            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Filler Word Density (um/uh)</span>
              <span className={`font-semibold ${isLikelyAI ? 'text-rose-600' : 'text-emerald-700'}`}>
                {candidateAnswer.signals?.fillers || (isLikelyAI ? '0 detected (Artificially fluent)' : 'Natural pauses & fillers detected')}
              </span>
            </div>

            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Sentence Uniformity</span>
              <span className={`font-semibold ${isLikelyAI ? 'text-rose-600' : 'text-slate-700'}`}>
                {candidateAnswer.signals?.uniformity || (isLikelyAI ? 'Robotic sentence rhythm' : 'Natural human variability')}
              </span>
            </div>

            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Backend Endpoint</span>
              <span className="font-mono text-[10px] text-slate-600">
                POST /api/interviews/analyze-response
              </span>
            </div>
          </div>

          {isLikelyAI && (
            <div className="flex items-start gap-2 bg-rose-100/80 text-rose-800 rounded-lg p-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <span>
                <strong>Warning:</strong> Candidate response exhibits structural patterns matching LLM-generated speech. Consider asking a spontaneous follow-up question.
              </span>
            </div>
          )}
        </div>

        {/* HR Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLocalFlagged(!localFlagged);
                if (onFlagAnswer) onFlagAnswer(!localFlagged);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                localFlagged
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              {localFlagged ? 'Flagged for Audit' : 'Flag as Suspicious'}
            </button>
          </div>

          {onNextQuestion && (
            <Button size="sm" variant="primary" onClick={onNextQuestion}>
              Dispatch Next Question
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
