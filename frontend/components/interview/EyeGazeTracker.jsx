'use client';

import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { updateInterviewGaze } from '@/lib/interview/api';

const MODEL_PATH = '/models/face_landmarker.task';
const WASM_PATH = '/mediapipe/wasm';
const SAMPLE_INTERVAL_MS = 250;
const STATUS_HEARTBEAT_MS = 3000;
const STABLE_SAMPLES_REQUIRED = 3;

function averageLandmark(landmarks, indices) {
  const points = indices.map((index) => landmarks[index]).filter(Boolean);
  if (!points.length) return null;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function isLookingAtScreen(landmarks) {
  if (!landmarks || landmarks.length < 478) return false;

  const eyes = [
    { corners: [33, 133], iris: [468, 469, 470, 471, 472], top: 159, bottom: 145 },
    { corners: [362, 263], iris: [473, 474, 475, 476, 477], top: 386, bottom: 374 },
  ];

  return eyes.every(({ corners, iris, top, bottom }) => {
    const cornerPoints = corners.map((index) => landmarks[index]);
    const irisCenter = averageLandmark(landmarks, iris);
    const upper = landmarks[top];
    const lower = landmarks[bottom];
    if (!cornerPoints[0] || !cornerPoints[1] || !irisCenter || !upper || !lower) return false;

    const left = Math.min(cornerPoints[0].x, cornerPoints[1].x);
    const right = Math.max(cornerPoints[0].x, cornerPoints[1].x);
    const topY = Math.min(upper.y, lower.y);
    const bottomY = Math.max(upper.y, lower.y);
    const width = right - left;
    const height = bottomY - topY;
    if (width <= 0 || height <= 0) return false;

    const horizontal = (irisCenter.x - left) / width;
    const vertical = (irisCenter.y - topY) / height;
    // Broad center windows accommodate normal webcam placement and small eye movements.
    return horizontal >= 0.2 && horizontal <= 0.8 && vertical >= 0.08 && vertical <= 0.92;
  });
}

export default function EyeGazeTracker({ stream, sessionId, onStatus }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!stream || !sessionId || !videoElement) return undefined;

    let disposed = false;
    let timer = null;
    let landmarker = null;
    let lastSentStatus = null;
    let pendingStatus = null;
    let stableCount = 0;
    let lastSentAt = 0;
    let lastInferenceError = null;

    const publish = async (isLooking, faceDetected) => {
      const now = Date.now();
      const status = isLooking ? 'high' : 'low';
      onStatus?.({ status, faceDetected, updatedAt: new Date(now).toISOString() });
      if (status !== lastSentStatus || now - lastSentAt >= STATUS_HEARTBEAT_MS) {
        lastSentStatus = status;
        lastSentAt = now;
        try {
          await updateInterviewGaze(sessionId, {
            is_looking_at_screen: isLooking,
            face_detected: faceDetected,
            timestamp: new Date(now).toISOString(),
            attention_score: isLooking ? 100 : 0,
          });
        } catch (error) {
          onStatus?.({ status: 'error', message: error.message });
        }
      }
    };

    const start = async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
        if (disposed) return;

        videoElement.srcObject = stream;
        await videoElement.play();

        const sample = () => {
          if (disposed) return;
          const video = videoElement;
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            try {
              const result = landmarker.detectForVideo(video, performance.now());
              lastInferenceError = null;
              const landmarks = result.faceLandmarks?.[0];
              const faceDetected = Boolean(landmarks);
              const observed = faceDetected && isLookingAtScreen(landmarks);
              if (observed === pendingStatus) stableCount += 1;
              else {
                pendingStatus = observed;
                stableCount = 1;
              }

              if (stableCount >= STABLE_SAMPLES_REQUIRED && (
                (observed ? 'high' : 'low') !== lastSentStatus || Date.now() - lastSentAt >= STATUS_HEARTBEAT_MS
              )) {
                publish(observed, faceDetected);
              }
            } catch (error) {
              // Recover from a transient frame/model failure without stopping the
              // candidate camera or permanently disabling gaze sampling.
              if (!disposed && lastInferenceError !== error.message) {
                lastInferenceError = error.message;
                onStatus?.({ status: 'error', message: error.message || 'Eye tracking is temporarily unavailable.' });
              }
              pendingStatus = null;
              stableCount = 0;
              lastSentStatus = null;
              timer = setTimeout(sample, 1000);
              return;
            }
          }
          timer = setTimeout(sample, SAMPLE_INTERVAL_MS);
        };
        sample();
      } catch (error) {
        if (!disposed) onStatus?.({ status: 'error', message: error.message || 'Eye tracking could not start.' });
      }
    };

    start();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      landmarker?.close();
      videoElement.srcObject = null;
    };
  }, [stream, sessionId, onStatus]);

  return <video ref={videoRef} autoPlay muted playsInline className="sr-only" aria-hidden="true" />;
}
