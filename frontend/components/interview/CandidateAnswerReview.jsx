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
  showActions = true,
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
            The submitted transcript appears here as soon as it is saved. Gemma review follows in the background.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Interview session active · no answer submitted yet</span>
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
  const aiScore = candidateAnswer.aiScore ?? 0;
  const analysisPending = candidateAnswer.analysisStatus === 'pending';
  const isLikelyAI = Boolean(candidateAnswer.flaggedForReview);
  const isSuspicious = candidateAnswer.verdict === 'inconclusive' || candidateAnswer.verdict === 'review_required';

  const verdictConfig = analysisPending
    ? {
        label: 'Transcript received · Gemma review running',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50 border-indigo-200',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: Bot,
      }
    : isLikelyAI
    ? {
        label: 'Flagged for Human Review',
        color: 'text-rose-700',
        bg: 'bg-rose-50 border-rose-300',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: ShieldAlert,
      }
    : isSuspicious
    ? {
        label: 'Inconclusive — More Evidence Needed',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-300',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: AlertTriangle,
      }
    : {
        label: 'No Strong AI-like Patterns',
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
              Candidate Response (Transcript)
            </h4>
            <p className="text-[11px] text-slate-400">Submitted · {candidateAnswer.timestamp || 'Just now'}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${verdictConfig.badge}`}>
          <VIcon className="w-3.5 h-3.5" />
          <span>{analysisPending ? 'Checking answer…' : `Pattern score: ${aiScore}/100`}</span>
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
                Transcript Style Review
              </span>
            </div>
            <span className={`text-xs font-semibold ${verdictConfig.color}`}>
              {verdictConfig.label}
            </span>
          </div>

          {analysisPending && (
            <p role="status" className="rounded-lg bg-white/80 p-2 text-xs text-indigo-800">
              The transcript is saved and visible to HR. Gemma is checking answer style in the background.
            </p>
          )}

          <details className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">Review analysis details</summary>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vocabulary Complexity</span>
              <span className="font-semibold text-slate-700">
                {candidateAnswer.signals?.vocabulary || 'Not available'}
              </span>
            </div>

            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Filler Word Density (um/uh)</span>
              <span className="font-semibold text-slate-700">
                {candidateAnswer.signals?.fillers || 'Not available'}
              </span>
            </div>

            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Sentence Uniformity</span>
              <span className="font-semibold text-slate-700">
                {candidateAnswer.signals?.uniformity || 'Not available'}
              </span>
            </div>

            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Personal Context</span>
              <span className="font-semibold text-slate-700">
                {candidateAnswer.signals?.personal_context || 'Not available'}
              </span>
            </div>
            <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Confidence</span>
              <span className="font-semibold text-slate-700 capitalize">{candidateAnswer.confidence || 'low'}</span>
            </div>
            </div>

            {candidateAnswer.reasons?.length > 0 && (
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-700">
                {candidateAnswer.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
              </ul>
            )}
            <p className="mt-2 text-[10px] text-slate-500">
              {candidateAnswer.note || 'Transcript style only; audio prosody and authorship cannot be established from this score.'}
              {candidateAnswer.analysisSource ? ` Analysis: ${candidateAnswer.analysisSource}.` : ''}
            </p>
            {candidateAnswer.modelError && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
                Gemma was unavailable for this answer; the displayed score uses text-pattern signals only. {candidateAnswer.modelError}
              </p>
            )}
          </details>

          {isLikelyAI && (
            <div className="flex items-start gap-2 bg-rose-100/80 text-rose-800 rounded-lg p-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <span>
                <strong>Review signal, not proof:</strong> This transcript showed several AI-like style patterns. Consider asking a consistent follow-up question and reviewing the response in context.
              </span>
            </div>
          )}

        </div>

        {/* HR Action Controls */}
        {showActions && <div className="flex items-center justify-between pt-2 border-t border-slate-100">
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
        </div>}
      </div>
    </div>
  );
}
