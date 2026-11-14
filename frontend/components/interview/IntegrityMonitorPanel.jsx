'use client';

import { AlertTriangle, CheckCircle2, Clock3, Eye, Monitor, ShieldAlert, XCircle } from 'lucide-react';

const riskConfig = {
  clean: { label: 'Integrity healthy', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', Icon: CheckCircle2 },
  warning: { label: 'Review signals', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', Icon: AlertTriangle },
  critical: { label: 'Critical signals', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', Icon: XCircle },
};

const severityColor = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
  critical: 'bg-rose-200 text-rose-800',
};

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
  const overallRisk = integrityScore < 50 ? 'critical' : integrityScore < 80 ? 'warning' : 'clean';
  const rc = riskConfig[overallRisk];
  const eventList = events || [];
  const stats = [
    { label: 'Eye look-aways', value: gazeLookaways, warn: 2, crit: 5, Icon: Eye },
    { label: 'Tab switches', value: tabSwitches, warn: 3, crit: 7, Icon: Monitor },
    { label: 'Typing bursts', value: typingDetections, warn: 1, crit: 5 },
    { label: 'Focus losses', value: focusLosses, warn: 2, crit: 5 },
    { label: 'Paste events', value: pasteEvents, warn: 2, crit: 5 },
    { label: 'Screen share', value: screenSharing ? 'On' : 'Off', active: screenSharing },
    {
      label: 'Answer signal',
      value: answerIntegrityScore == null
        ? answersPending ? 'Analyzing' : answersSubmitted ? 'Pending' : 'No answers'
        : `${Math.round(answerIntegrityScore)}%`,
      detail: answersAnalyzed ? `${answersAnalyzed} analyzed` : 'AI style signal',
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${rc.bg}`}>
            <rc.Icon className={`h-4 w-4 ${rc.color}`} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-tight text-slate-900">Integrity activity</h2>
            <p className="truncate text-[10px] leading-tight text-slate-500">
              {sessionActive ? 'Live monitoring · browser signals and answer analysis' : 'Monitoring begins when the interview starts'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${rc.bg} ${rc.color}`}>
          <span>{rc.label}</span>
          <span className="h-1 w-1 rounded-full bg-current opacity-50" />
          <span>{integrityScore}%</span>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
        {stats.map(({ label, value, warn, crit, active, detail, Icon }) => {
          const numeric = typeof value === 'number' ? value : null;
          const valueColor = numeric == null
            ? active ? 'text-indigo-700' : label === 'Screen share' ? 'text-slate-400' : 'text-slate-700'
            : numeric >= crit ? 'text-rose-600' : numeric >= warn ? 'text-amber-600' : 'text-slate-800';

          return (
            <div key={label} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              {Icon && <Icon className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9px] font-medium leading-tight text-slate-500">{label}</p>
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <p className={`truncate text-sm font-bold leading-tight ${valueColor}`}>{value ?? 0}</p>
                  {detail && <p className="truncate text-[9px] leading-tight text-slate-400">{detail}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 pt-1.5">
        <div className="mb-1 flex shrink-0 items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recent events</h3>
          <span className="text-[10px] font-medium text-slate-400">{eventList.length} recorded</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1" aria-live="polite">
          {eventList.length === 0 ? (
            <div className="flex h-full min-h-8 items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              {sessionActive ? 'No integrity events recorded yet' : 'No session activity yet'}
            </div>
          ) : (
            <ul className="space-y-1">
              {eventList.map((ev, i) => (
                <li key={ev.id || `${ev.eventType}-${ev.timestamp}-${i}`} className="flex min-w-0 items-center gap-2 rounded-md border border-slate-100 bg-white px-2 py-1">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${severityColor[ev.severity] || severityColor.low}`}>
                    {ev.severity || 'low'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium capitalize text-slate-700">
                    {ev.eventType === 'gaze_lookaway' ? 'Eye look-away' : ev.eventType?.replace(/_/g, ' ') || 'Integrity event'}
                    {ev.metadata && <span className="ml-1 font-normal text-slate-400">· {JSON.stringify(ev.metadata)}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[9px] tabular-nums text-slate-400">
                    <Clock3 className="h-3 w-3" />
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
