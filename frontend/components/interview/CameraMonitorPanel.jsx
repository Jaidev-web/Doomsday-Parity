'use client';

'use client';

import { useEffect, useRef } from 'react';
import { CameraOff, Eye, EyeOff, Shield } from 'lucide-react';

export default function CameraMonitorPanel({
  active,
  gazeStatus = 'unknown',
  attentionPct = null,
  faceDetected = null,
  candidateName = 'Candidate',
  overlay = false,
  candidateStream = null,
  connectionState = 'waiting',
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = candidateStream;
      if (candidateStream) videoRef.current.play().catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.srcObject = candidateStream;
      if (candidateStream) audioRef.current.play().catch(() => {});
    }
  }, [candidateStream]);

  const config = {
    high: { label: 'Looking at screen', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: Eye },
    low: { label: 'Looking away from screen', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', icon: EyeOff },
    unknown: { label: 'Waiting for candidate camera', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', icon: Eye },
    error: { label: 'Eye tracking unavailable', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', icon: EyeOff },
  };
  const status = config[gazeStatus] || config.unknown;
  const StatusIcon = status.icon;

  return (
    <div className="relative">
      <div className="relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden bg-slate-900 p-5 text-center">
        {candidateStream ? (
          <>
            <video autoPlay playsInline muted ref={videoRef} className="absolute inset-0 h-full w-full object-cover" />
            <audio autoPlay controls ref={audioRef} className="absolute bottom-3 right-3 z-20 h-8 w-36" />
          </>
        ) : (
          <>
            <CameraOff className="w-8 h-8 text-slate-500" />
            <span className="text-xs font-medium text-slate-300">{candidateName} · {connectionState === 'closed' ? 'Interview ended' : 'Waiting for candidate camera'}</span>
            <span className="max-w-xs text-[10px] leading-relaxed text-slate-500">
              Once connected, video is shared peer-to-peer. Eye landmarks are processed on the candidate’s device.
            </span>
          </>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white/70">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span>{active ? 'Session gaze telemetry' : 'Session not started'}</span>
        </div>
        {overlay && (
          <>
            <div className="absolute left-[13px] top-[13px] flex flex-wrap gap-2 text-[11px] font-semibold text-white">
              <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1.5 backdrop-blur">Eye Gaze Monitor</span>
              <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1.5 backdrop-blur">{candidateStream ? 'Live candidate video' : 'Waiting for video'}</span>
            </div>
            <div className="absolute bottom-[13px] left-[13px] w-[min(300px,calc(100%_-_240px))] rounded-xl border border-white/15 bg-slate-950/75 p-3 text-left text-white shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold"><StatusIcon className={`h-4 w-4 ${gazeStatus === 'high' ? 'text-emerald-300' : gazeStatus === 'low' ? 'text-rose-300' : 'text-slate-300'}`} />{status.label}</span>
                <span className="font-mono text-xs font-bold">{attentionPct !== null ? `${attentionPct}%` : '—'}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className={`h-full rounded-full transition-all duration-300 ${attentionPct === null ? 'bg-slate-400' : attentionPct >= 70 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${Math.max(0, Math.min(100, attentionPct ?? 0))}%` }} />
              </div>
              {faceDetected === false && <p className="mt-1 text-[10px] text-rose-200">No face detected in candidate camera.</p>}
            </div>
          </>
        )}
      </div>

      {!overlay && <div className={`space-y-1.5 rounded-lg border p-2.5 ${status.bg}`}>
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
      </div>}
    </div>
  );
}
