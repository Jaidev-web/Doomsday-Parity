'use client';

import { useEffect, useRef, useState } from 'react';
import { INTERVIEW_API_BASE, INTERVIEW_ENDPOINTS } from '@/lib/interview/config';

async function postSignal(sessionId, role, type, payload) {
  const response = await fetch(`${INTERVIEW_API_BASE}${INTERVIEW_ENDPOINTS.webrtcSignals(sessionId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, type, payload }),
  });
  if (!response.ok) throw new Error(`Meeting connection signal failed (${response.status})`);
}

export default function useInterviewPeer(sessionId, role, localStream) {
  const [peerState, setPeerState] = useState({ sessionId: null, localStream: null, remoteStream: null, connectionState: 'waiting' });
  const peerRef = useRef(null);
  const isCurrentPeer = peerState.sessionId === sessionId && peerState.localStream === localStream;
  const remoteStream = isCurrentPeer ? peerState.remoteStream : null;
  const connectionState = !sessionId || !localStream
    ? 'waiting'
    : isCurrentPeer ? peerState.connectionState : 'connecting';

  useEffect(() => {
    if (!sessionId || !localStream) return undefined;

    let disposed = false;
    let cursor = 0;
    let polling = false;
    let sessionClosed = false;
    let pollTimer;
    const pendingCandidates = [];
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerRef.current = peer;

    peer.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream && !disposed) setPeerState({ sessionId, localStream, remoteStream: stream, connectionState: peer.connectionState });
    };
    peer.onconnectionstatechange = () => {
      if (!disposed) setPeerState((previous) => ({
        sessionId,
        localStream,
        remoteStream: previous.sessionId === sessionId && previous.localStream === localStream ? previous.remoteStream : null,
        connectionState: peer.connectionState,
      }));
    };
    peer.onicecandidate = ({ candidate }) => {
      if (!candidate || disposed) return;
      postSignal(sessionId, role, 'ice_candidate', candidate.toJSON()).catch(() => {
        if (!disposed) setPeerState((previous) => ({ ...previous, sessionId, localStream, connectionState: 'disconnected' }));
      });
    };
    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    const applyCandidate = async (candidate) => {
      if (peer.remoteDescription) await peer.addIceCandidate(candidate);
      else pendingCandidates.push(candidate);
    };

    const poll = async () => {
      if (disposed || polling) return;
      polling = true;
      try {
        const response = await fetch(
          `${INTERVIEW_API_BASE}${INTERVIEW_ENDPOINTS.webrtcSignals(sessionId)}?role=${role}&after=${cursor}`,
          { cache: 'no-store' }
        );
        if (!response.ok) throw new Error(`Meeting connection check failed (${response.status})`);
        const result = await response.json();
        cursor = result.next_cursor ?? cursor;
        if (result.status !== 'active') {
          sessionClosed = true;
          if (!disposed) setPeerState((previous) => ({ ...previous, sessionId, localStream, connectionState: 'closed' }));
          return;
        }
        for (const signal of result.signals || []) {
          if (signal.type === 'ice_candidate') {
            await applyCandidate(signal.payload);
            continue;
          }
          if (signal.type !== 'description') continue;
          const description = signal.payload;
          if (description.type === 'offer' && role === 'candidate') {
            await peer.setRemoteDescription(description);
            while (pendingCandidates.length) await peer.addIceCandidate(pendingCandidates.shift());
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await postSignal(sessionId, role, 'description', peer.localDescription.toJSON());
          } else if (description.type === 'answer' && role === 'hr') {
            await peer.setRemoteDescription(description);
            while (pendingCandidates.length) await peer.addIceCandidate(pendingCandidates.shift());
          }
        }
      } catch {
        if (!disposed) setPeerState((previous) => ({ ...previous, sessionId, localStream, connectionState: 'disconnected' }));
      } finally {
        polling = false;
        if (!disposed && !sessionClosed) pollTimer = window.setTimeout(poll, 600);
      }
    };

    const start = async () => {
      try {
        if (role === 'hr') {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          await postSignal(sessionId, role, 'description', peer.localDescription.toJSON());
        }
        if (!disposed) {
          setPeerState((previous) => ({ ...previous, sessionId, localStream, connectionState: 'connecting' }));
          poll();
        }
      } catch {
        if (!disposed) setPeerState((previous) => ({ ...previous, sessionId, localStream, connectionState: 'disconnected' }));
      }
    };
    start();

    return () => {
      disposed = true;
      window.clearTimeout(pollTimer);
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.onconnectionstatechange = null;
      peer.close();
      if (peerRef.current === peer) peerRef.current = null;
    };
  }, [sessionId, role, localStream]);

  return { remoteStream, connectionState };
}
