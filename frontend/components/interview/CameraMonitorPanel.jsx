'use client';

import { CameraOff, Eye, EyeOff, Shield } from 'lucide-react';

export default function CameraMonitorPanel({
  active,
  gazeStatus = 'unknown',
  attentionPct = null,
  faceDetected = null,
  candidateName = 'Candidate',
}) {
  const config = {
    high: { label: 'Looking at screen', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: Eye },
    low: { label: 'Looking away from screen', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', icon: EyeOff },
    unknown: { label: 'Waiting for candidate camera', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', icon: Eye },
    error: { label: 'Eye tracking unavailable', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', icon: EyeOff },
  };
  const status = config[gazeStatus] || config.unknown;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-2.5">
      <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video border border-slate-800 flex flex-col items-center justify-center gap-2 p-5 text-center">
        <CameraOff className="w-8 h-8 text-slate-500" />
        <span className="text-xs font-medium text-slate-300">{candidateName} · Candidate-side eye tracking</span>
        <span className="max-w-xs text-[10px] leading-relaxed text-slate-500">
          Eye landmarks are processed on the candidate’s device. Only the attention status is sent to this session.
        </span>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white/70 bg-black/50 rounded px-2 py-0.5">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span>{active ? 'Session gaze telemetry' : 'Session not started'}</span>
        </div>
      </div>

      <div className={`p-2.5 rounded-lg border ${status.bg} space-y-1.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
            <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
          </div>
          {attentionPct !== null && <span className="text-xs font-mono font-bold text-slate-700">{attentionPct}%</span>}
        </div>
        {attentionPct !== null && (
          <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${attentionPct >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${attentionPct}%` }} />
          </div>
        )}
        {faceDetected === false && gazeStatus !== 'unknown' && (
          <p className="text-[10px] text-rose-700">No face detected in the candidate camera.</p>
        )}
      </div>
    </div>
  );
}
