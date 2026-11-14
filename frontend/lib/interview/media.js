export function getCameraAccessError(error, device = 'camera and microphone') {
  if ((typeof window !== 'undefined' && !window.isSecureContext)
    || (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia)
    || error?.message === 'Secure context required') {
    return 'Camera access requires a trusted HTTPS page. Open the HTTPS interview link and trust the LAN certificate on this device.';
  }

  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError' || error?.name === 'SecurityError') {
    return `Browser permission for the ${device} was denied. Allow access for this site in browser settings, then retry. On macOS, also allow the browser under System Settings → Privacy & Security → Camera and Microphone.`;
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return `No ${device} device was found. Connect or enable a camera, then retry.`;
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return `The ${device} is busy or unavailable. Close other apps using it, then retry.`;
  }
  if (error?.name === 'OverconstrainedError' || error?.name === 'ConstraintNotSatisfiedError') {
    return `The camera does not support the requested video settings. Check the camera connection and retry.`;
  }
  return error?.message ? `Could not access the ${device}: ${error.message}` : `Could not access the ${device}. Check browser permissions and retry.`;
}

export function getInterviewMediaConstraints({ audio = true } = {}) {
  return {
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
  };
}
