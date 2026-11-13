'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CameraMonitorPanel
// Displays candidate webcam feed, approximate gaze estimation via canvas analysis,
// and emits integrity events when candidate looks away.
//
// GAZE ESTIMATION: Uses browser FaceDetector API (Chrome 70+) when available,
// falls back to luminance-variance sampling. Labelled "Approximate" — not
// a production-grade CV model.
// ─────────────────────────────────────────────────────────────────────────────

const GAZE_AWAY_THRESHOLD_MS = 3000;

export default function CameraMonitorPanel({
  stream,
  active,
  onIntegrityEvent,
  candidateName = 'Candidate',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const gazeAwayStartRef = useRef(null);
  const frameCountRef = useRef(0);

  const [cameraStatus, setCameraStatus] = useState('inactive'); // 'inactive'|'active'|'error'
  const [gazeStatus, setGazeStatus] = useState('unknown');     // 'focused'|'away'|'unknown'
  const [faceDetected, setFaceDetected] = useState(null);
  const [gazeAwayCount, setGazeAwayCount] = useState(0);
  const [attentionPct, setAttentionPct] = useState(100);
  const [isFaceApiSupported, setIsFaceApiSupported] = useState(false);

  // Attach stream to video element
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});
    setCameraStatus('active');

    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [stream]);

  // Check FaceDetector support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      setIsFaceApiSupported(true);
      try {
        detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch {}
    }
  }, []);

  // Gaze analysis loop
  const analyzeFrame = useCallback(async () => {
    if (!active || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    frameCountRef.current++;
    // Only analyze every 15 frames to reduce CPU load
    if (frameCountRef.current % 15 !== 0) return;

    let isFacing = false;

    if (detectorRef.current) {
      try {
        const faces = await detectorRef.current.detect(video);
        isFacing = faces.length > 0;
        if (faces.length > 0) {
          const face = faces[0].boundingBox;
          const faceCX = face.x + face.width / 2;
          const frameCX = canvas.width / 2;
          const offset = Math.abs(faceCX - frameCX) / canvas.width;
          isFacing = offset < 0.35; // face must be roughly centered
        }
      } catch {}
    } else {
      // Luminance variance fallback
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let sum = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += lum;
          count++;
        }
        const mean = sum / count;
        let variance = 0;
        for (let i = 0; i < data.length; i += 16) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          variance += Math.pow(lum - mean, 2);
        }
        variance /= count;
        isFacing = variance > 300;
      } catch {}
    }

    setFaceDetected(isFacing);

    if (isFacing) {
      setGazeStatus('focused');
      gazeAwayStartRef.current = null;
    } else {
      setGazeStatus('away');
      if (!gazeAwayStartRef.current) {
        gazeAwayStartRef.current = Date.now();
      } else if (Date.now() - gazeAwayStartRef.current > GAZE_AWAY_THRESHOLD_MS) {
        // Prolonged gaze-away event
        setGazeAwayCount((c) => {
          const next = c + 1;
          setAttentionPct((p) => Math.max(0, p - 8));
          if (onIntegrityEvent) {
            onIntegrityEvent({
              eventType: 'gaze_away',
              severity: next >= 4 ? 'high' : 'medium',
              timestamp: new Date().toISOString(),
              metadata: { gaze_away_count: next },
            });
          }
          return next;
        });
        gazeAwayStartRef.current = Date.now();
      }
    }
  }, [active, onIntegrityEvent]);

  // Run analysis loop via rAF
  useEffect(() => {
    if (!active || cameraStatus !== 'active') return;

    const loop = async () => {
      await analyzeFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, cameraStatus, analyzeFrame]);

  const gazeConfig = {
    focused: { label: 'Looking at screen', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: Eye },
    away:    { label: 'Eyes away from screen', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', icon: EyeOff },
    unknown: { label: 'Tracking gaze…', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', icon: Eye },
  };
  const gc = gazeConfig[gazeStatus];
  const GIcon = gc.icon;

  return (
    <div className="space-y-2.5">
      {/* Video feed */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video border border-slate-800">
        {stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
            {/* Top Left: Candidate Feed & Gaze Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md bg-black/60 text-white border border-white/10">
              <span className={`w-2 h-2 rounded-full ${gc.dot} ${gazeStatus === 'away' ? 'animate-pulse' : ''}`} />
              <span className="truncate max-w-[120px]">{candidateName}</span>
              <span className="text-slate-400">·</span>
              <span>{gc.label}</span>
            </div>

            {/* Top Right: Attention score */}
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-black/60 text-white border border-white/10">
              {attentionPct}% Attn
            </div>

            {/* Bottom: Proctored watermark */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white/70 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>Gaze & Integrity Stream</span>
            </div>

            {/* Hidden canvas for frame analysis */}
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500 space-y-1">
            <CameraOff className="w-8 h-8 opacity-40 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Candidate Camera Feed</span>
            <span className="text-[10px] text-slate-500">Live feed connects when candidate starts session</span>
          </div>
        )}
      </div>

      {/* Real-time Gaze Status & Attention Meter */}
      <div className={`p-2.5 rounded-lg border ${gc.bg} space-y-1.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GIcon className={`w-3.5 h-3.5 ${gc.color}`} />
            <span className={`text-xs font-semibold ${gc.color}`}>{gc.label}</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">{attentionPct}%</span>
        </div>

        {/* Attention meter bar */}
        <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              attentionPct >= 70 ? 'bg-emerald-500' : attentionPct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${attentionPct}%` }}
          />
        </div>

        {gazeAwayCount > 0 && (
          <div className="flex justify-between items-center text-[11px] text-amber-700 font-medium pt-0.5">
            <span>Look-away events detected:</span>
            <span className="font-bold">{gazeAwayCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
