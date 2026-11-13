'use client';

import { CheckCircle2, Download, RotateCcw, Trophy, AlertTriangle, Mic, Eye, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function InterviewCompletion({ candidate, sessionId, history, integrityStats, onReset }) {
  const questionCount = history?.length || 0;
  const aiFlags = history?.filter((h) => h.aiFlag).length || 0;
  const integrityRisk =
    integrityStats?.tabSwitches >= 7 || aiFlags >= 2
      ? 'critical'
      : integrityStats?.tabSwitches >= 3 || aiFlags >= 1
      ? 'warning'
      : 'clean';

  const riskConfig = {
    clean:    { label: 'Clean', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', Icon: CheckCircle2 },
    warning:  { label: 'Review Needed', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', Icon: AlertTriangle },
    critical: { label: 'Critical — Review Required', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', Icon: AlertTriangle },
  };
  const rc = riskConfig[integrityRisk];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-xl w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Interview Complete</h1>
          <p className="text-sm text-slate-500">
            Session {sessionId ? `#${sessionId.slice(-8)}` : ''} · {candidate?.name || 'Candidate'}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Questions', value: questionCount, Icon: Mic, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'AI Flags', value: aiFlags, Icon: Eye, color: aiFlags > 0 ? 'text-rose-600' : 'text-emerald-600', bg: aiFlags > 0 ? 'bg-rose-50' : 'bg-emerald-50' },
            { label: 'Tab Switches', value: integrityStats?.tabSwitches || 0, Icon: Shield, color: integrityStats?.tabSwitches >= 3 ? 'text-amber-600' : 'text-slate-600', bg: 'bg-slate-50' },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Integrity verdict */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${rc.bg}`}>
          <rc.Icon className={`w-5 h-5 shrink-0 ${rc.color}`} />
          <div>
            <p className={`text-sm font-semibold ${rc.color}`}>{rc.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">Based on integrity monitoring and AI response analysis</p>
          </div>
        </div>

        {/* Transcript preview */}
        {history && history.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transcript</p>
            {history.map((item, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-slate-700">Q{i + 1}: {item.question}</p>
                {item.answer && <p className="text-slate-500 mt-0.5 ml-3">{item.answer.slice(0, 150)}{item.answer.length > 150 ? '…' : ''}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={onReset} className="flex-1" icon={RotateCcw}>
            New Session
          </Button>
          <Link href={`/dashboard/candidates/${candidate?.id || ''}`} className="flex-1">
            <Button variant="primary" size="md" className="w-full" icon={Download}>
              View Full Report
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

