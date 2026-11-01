import { useCallback, useEffect, useRef, useState } from 'react';
import { JPEG_QUALITY, MAX_IMAGE_DIM } from '@/lib/snapConfig';

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const runId = useRef(0); // StrictMode me start() do baar chalta hai, purana stream chhod do
  const [status, setStatus] = useState('starting'); // starting | ready | error
  const [error, setError] = useState(null); // denied | notfound | busy | insecure | unknown

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    const id = ++runId.current;
    stop();
    setStatus('starting');
    setError(null);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('insecure');
      setStatus('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // peeche wala camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      if (id !== runId.current) {
        stream.getTracks().forEach((t) => t.stop()); // naya start aa chuka, ye stream bekaar
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('ready');
    } catch (e) {
      if (id !== runId.current) return;
      setError(
        e.name === 'NotAllowedError'
          ? 'denied'
          : e.name === 'NotFoundError'
            ? 'notfound'
            : e.name === 'NotReadableError'
              ? 'busy'
              : 'unknown',
      );
      setStatus('error');
    }
  }, [stop]);

  useEffect(() => {
    start();
    return () => {
      runId.current++;
      stop();
    };
  }, [start, stop]);

  // Frame ko max 1600 px ki JPEG me badlo. Canvas se nikli photo me EXIF (GPS) nahi hota.
  const capture = useCallback(
    () =>
      new Promise((resolve, reject) => {
        const v = videoRef.current;
        if (!v || !v.videoWidth) return reject(new Error('NOT_READY'));
        const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(v.videoWidth, v.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('ENCODE_FAILED'))),
          'image/jpeg',
          JPEG_QUALITY,
        );
      }),
    [],
  );

  return { videoRef, status, error, start, capture };
}
