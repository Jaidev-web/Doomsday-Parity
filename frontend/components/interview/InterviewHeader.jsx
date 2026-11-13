'use client';

import { ArrowLeft, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function InterviewHeader({ candidate, sessionId, questionNumber, totalQuestions, mode, onModeToggle }) {
  const progress = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/candidates/${candidate?.id || ''}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
            <Link href="/dashboard/candidates" className="hover:text-slate-600 shrink-0">Candidates</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-slate-600 font-medium truncate">{candidate?.name || 'Interview'}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-slate-800 font-semibold shrink-0">Interview</span>
          </div>
        </div>

        {/* Progress */}
        {totalQuestions > 0 && (
          <div className="hidden md:flex flex-col items-center gap-1 flex-1 max-w-xs">
            <div className="flex justify-between w-full text-xs text-slate-400">
              <span>Progress</span>
              <span>Q{questionNumber} / {totalQuestions}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Candidate info + mode toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {candidate && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700">{candidate.name}</p>
                <p className="text-xs text-slate-400">{candidate.position}</p>
              </div>
            </div>
          )}

          {/* Interviewer / Candidate mode toggle */}
          {onModeToggle && (
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {['interviewer', 'candidate'].map((m) => (
                <button
                  key={m}
                  onClick={() => onModeToggle(m)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all capitalize ${
                    mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'interviewer' ? '🎤 Copilot' : '👤 Candidate'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

