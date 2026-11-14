'use client';

import { useState } from 'react';
import { ShieldAlert, Wifi, Monitor, Eye, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function IntegrityMonitorPanel({
  events,
  tabSwitches,
  typingDetections = 0,
  gazeLookaways = 0,
  answerIntegrityScore = null,
  answersAnalyzed = 0,
  answersPending = 0,
  answersSubmitted = 0,
  integrityScore = 100,
  focusLosses,
  pasteEvents,
  screenSharing,
  sessionActive,
}) {
  const [expanded, setExpanded] = useState(true);

  const overallRisk = integrityScore < 50 ? 'critical' : integrityScore < 80 ? 'warning' : 'clean';

  const riskConfig = {
    clean:    { label: 'Clean',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', Icon: CheckCircle2 },
    warning:  { label: 'Warning',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',    Icon: AlertTriangle },
    critical: { label: 'Critical', color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',      Icon: XCircle },
  };
  const rc = riskConfig[overallRisk];

  const severityColor = {
    low:      'bg-slate-100 text-slate-600',
    medium:   'bg-amber-100 text-amber-700',
    high:     'bg-rose-100 text-rose-700',
    critical: 'bg-rose-200 text-rose-800',
  };

  return (
    <div className="space-y-3">
      {/* Overall risk */}
      <div className={`flex items-center justify-between p-3 rounded-lg border ${rc.bg}`}>
        <div className="flex items-center gap-2">
          <rc.Icon className={`w-4 h-4 ${rc.color}`} />
          <span className={`text-sm font-semibold ${rc.color}`}>Integrity: {rc.label}</span>
        </div>
          <span className={`text-xs font-medium ${rc.color}`}>{integrityScore}% · {events?.length || 0} event{events?.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Total blends browser monitoring (75%) with conclusive answer style analysis (25%). Before an answer is analyzed, the score uses browser monitoring only.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Eye look-aways', value: gazeLookaways, warn: 2, crit: 5 },
          { label: 'Tab switches', value: tabSwitches, warn: 3, crit: 7 },
          { label: 'Typing bursts', value: typingDetections, warn: 1, crit: 5 },
          { label: 'Focus losses', value: focusLosses, warn: 2, crit: 5 },
          { label: 'Paste events', value: pasteEvents, warn: 2, crit: 5 },
        ].map(({ label, value, warn, crit }) => (
          <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-lg font-bold mt-0.5 ${value >= crit ? 'text-rose-600' : value >= warn ? 'text-amber-600' : 'text-slate-700'}`}>
              {value || 0}
            </p>
          </div>
        ))}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <p className="text-xs text-slate-500">Screen share</p>
          <p className={`text-sm font-semibold mt-0.5 ${screenSharing ? 'text-indigo-600' : 'text-slate-400'}`}>
            {screenSharing ? 'Active' : 'Off'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="text-xs text-slate-500">Answer integrity signal</p>
          <p className="mt-0.5 text-lg font-bold text-slate-700">
            {answerIntegrityScore == null
              ? answersPending ? 'Analyzing…' : answersSubmitted ? 'No conclusive result' : 'No answers yet'
              : `${Math.round(answerIntegrityScore)}%`}
          </p>
          <p className="text-[10px] leading-relaxed text-slate-400">
            {answersAnalyzed ? `Based on ${answersAnalyzed} analyzed answer${answersAnalyzed === 1 ? '' : 's'}` : 'Needs a conclusive answer analysis'} · AI style signal, not proof of authorship
          </p>
        </div>
      </div>

      {/* Event log */}
      <div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-between w-full text-xs text-slate-500 font-medium uppercase tracking-wide mb-2"
        >
          <span>Event log ({events?.length || 0})</span>
          <span>{expanded ? '▾' : '▸'}</span>
        </button>

        {expanded && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {(!events || events.length === 0) && (
              <div className="text-center py-6 text-slate-400 text-xs">
                <ShieldAlert className="w-6 h-6 mx-auto mb-1 opacity-30" />
                No integrity events recorded
              </div>
            )}
            {events?.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 bg-white border border-slate-100 rounded-lg p-2.5">
                <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${severityColor[ev.severity] || severityColor.low}`}>
                  {ev.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 capitalize">{ev.eventType?.replace(/_/g, ' ')}</p>
                  {ev.metadata && (
                    <p className="text-xs text-slate-400 truncate">{JSON.stringify(ev.metadata)}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400 font-mono">
                  {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!sessionActive && (
        <p className="text-xs text-center text-slate-400">Start session to begin integrity monitoring</p>
      )}
    </div>
  );
}

