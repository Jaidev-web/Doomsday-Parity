'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, RotateCcw, Trophy, AlertTriangle, Mic, Eye, Shield, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getInterviewReport } from '@/lib/interview/api';

export default function InterviewCompletion({ candidate, sessionId, history, integrityStats, onReset }) {
  const [finalReport, setFinalReport] = useState(null);
  useEffect(() => {
    if (!sessionId) return undefined;
    let mounted = true;
    let timer;
    const refresh = async () => {
      try {
        const report = await getInterviewReport(sessionId);
        if (!mounted) return;
        setFinalReport(report);
        if (report.answers_pending > 0) timer = window.setTimeout(refresh, 1500);
      } catch {
        if (mounted) timer = window.setTimeout(refresh, 3000);
      }
    };
    refresh();
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [sessionId]);

  const questionCount = history?.length || 0;
  const aiFlags = finalReport?.ai_flagged_answers ?? history?.filter((h) => h.aiFlag).length ?? 0;
  const integrityScore = finalReport?.integrity_score ?? integrityStats?.integrityScore ?? 100;
  const integrityRisk = integrityScore < 50 ? 'critical' : integrityScore < 80 ? 'warning' : 'clean';

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Questions', value: questionCount, Icon: Mic, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'AI Flags', value: aiFlags, Icon: Eye, color: aiFlags > 0 ? 'text-rose-600' : 'text-emerald-600', bg: aiFlags > 0 ? 'bg-rose-50' : 'bg-emerald-50' },
            { label: 'Tab Switches', value: finalReport?.tab_switches ?? integrityStats?.tabSwitches ?? 0, Icon: Shield, color: (finalReport?.tab_switches ?? integrityStats?.tabSwitches ?? 0) >= 3 ? 'text-amber-600' : 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Eye Look-Aways', value: finalReport?.gaze_lookaways ?? integrityStats?.gazeAwayCount ?? 0, Icon: Eye, color: (finalReport?.gaze_lookaways ?? integrityStats?.gazeAwayCount ?? 0) >= 3 ? 'text-amber-600' : 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Typing Bursts', value: finalReport?.typing_bursts ?? integrityStats?.typingDetections ?? 0, Icon: MessageSquare, color: (finalReport?.typing_bursts ?? integrityStats?.typingDetections ?? 0) >= 3 ? 'text-amber-600' : 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Answer Integrity', value: finalReport?.answer_integrity_score == null ? (finalReport?.answers_pending > 0 ? 'Analyzing…' : finalReport?.answers_submitted > 0 ? 'No result' : 'No answers') : `${Math.round(finalReport.answer_integrity_score)}%`, Icon: Shield, color: finalReport?.answer_integrity_score != null && finalReport.answer_integrity_score < 50 ? 'text-rose-600' : 'text-slate-600', bg: 'bg-slate-50' },
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
            <p className="text-xs text-slate-500 mt-0.5">{integrityScore}% total integrity · combines browser monitoring and conclusive answer style signals when available</p>
          </div>
          <div className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-current text-sm font-bold" aria-label={`${integrityScore}% integrity score`}>
            {integrityScore}%
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

