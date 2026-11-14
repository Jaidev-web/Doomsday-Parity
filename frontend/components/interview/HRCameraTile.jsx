'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, User, Shield, Volume2, Wifi,
  Sparkles, CheckCircle2, Settings
} from 'lucide-react';

/**
 * HRCameraTile
 * Used in both HR Portal (as HR's self camera preview & broadcast control)
 * and Candidate Portal (as the incoming HR / AI Interviewer video feed).
 *
 * The peer connection uses backend offer/answer/ICE signaling. Audio and video
 * travel directly between participant browsers after negotiation.
 */
export default function HRCameraTile({
  mode = 'hr', // 'hr' (self-control) | 'candidate' (viewer view)
  interviewerName = 'Lead Technical Recruiter',
  interviewerRole = 'TrustHire Hiring Panel',
  isSpeaking = false,
  className = '',
  compact = false,
  localStream = null,
  remoteStream = null,
  connectionState = 'waiting',
}) {
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const videoRef = useRef(null);
  const activeStream = mode === 'hr' ? localStream : remoteStream;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeStream;
      if (activeStream) videoRef.current.play().catch(() => {});
    }
  }, [activeStream]);

  useEffect(() => {
    if (mode !== 'hr' || !localStream) return;
    localStream.getVideoTracks().forEach((track) => { track.enabled = cameraActive; });
    localStream.getAudioTracks().forEach((track) => { track.enabled = micActive; });
  }, [mode, localStream, cameraActive, micActive]);

  return (
    <div className={`relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Top Overlay Badge Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-medium border border-white/10">
          <span className={`w-2 h-2 rounded-full ${(mode === 'hr' ? cameraActive : Boolean(remoteStream)) ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
          <span className="truncate max-w-[140px]">{mode === 'hr' ? 'HR Camera (You)' : 'HR Interviewer'}</span>
        </div>

        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] font-mono border border-white/10">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>{connectionState === 'connected' ? 'Connected' : 'Waiting'}</span>
        </div>
      </div>

      {/* Main Video or Stylized Placeholder Feed */}
      <div className={`relative w-full aspect-video ${compact ? 'min-h-0' : 'min-h-[140px] sm:min-h-[160px]'} bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden`}>
        {activeStream && (mode !== 'hr' || cameraActive) ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={mode === 'hr'}
            controls={mode === 'candidate'}
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : mode === 'candidate' ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
            <Wifi className="mb-2 h-6 w-6" />
            <span className="text-xs font-semibold text-white">{connectionState === 'closed' ? 'Interview room closed' : 'Connecting to the interviewer…'}</span>
            <span className="mt-1 text-[10px]">This video appears when both participants are connected.</span>
          </div>
        ) : cameraActive ? (
          /* Stylized Professional Interviewer Feed Placeholder */
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-indigo-500/20">
                <User className="w-8 h-8 text-white/90" />
              </div>
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <Volume2 className="w-3 h-3 text-white" />
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-white tracking-wide">{interviewerName}</p>
              <p className="text-[11px] text-indigo-300 font-medium">{interviewerRole}</p>
            </div>

            {/* Speaking / Audio activity bar */}
            {isSpeaking && (
              <div className="flex items-center gap-1 pt-1">
                {[4, 10, 16, 8, 14, 6].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-400 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Camera Disabled */
          <div className="flex flex-col items-center justify-center text-slate-500 space-y-1">
            <VideoOff className="w-7 h-7 opacity-40" />
            <span className="text-xs">Camera is muted</span>
          </div>
        )}
      </div>

      {/* Bottom Controls / Info Bar */}
      <div className={`bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 ${compact ? 'gap-1 px-1.5 py-1' : 'px-3 py-2'}`}>
        <div className="flex items-center gap-1.5 truncate">
          <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className={`text-slate-300 truncate ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
            {mode === 'hr'
              ? (connectionState === 'connected' ? 'Peer-to-peer interview' : 'Local camera preview')
              : (connectionState === 'connected' ? 'Peer-to-peer interview' : 'Waiting for interviewer video')}
          </span>
        </div>

        {/* HR Self Controls (Only shown on HR side) */}
        {mode === 'hr' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setMicActive(!micActive)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg text-xs transition-colors ${
                micActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400'
              }`}
              title={micActive ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg text-xs transition-colors ${
                cameraActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400'
              }`}
              title={cameraActive ? 'Turn camera off' : 'Turn camera on'}
            >
              {cameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
