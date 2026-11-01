import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCamera } from '@/hooks/useCamera';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const ERROR_KEY = {
  denied: 'snap.cameraDenied',
  notfound: 'snap.cameraNotFound',
  busy: 'snap.cameraBusy',
  insecure: 'snap.cameraInsecure',
  unknown: 'snap.cameraUnknown',
};

// Sirf live camera. Gallery se photo lene ka option jaan-boojh ke nahi hai.
// onCapture({ blob, capturedAt })   children = upar-left overlay (GPS badge)
export default function CameraCapture({ onCapture, children }) {
  const { t } = useTranslation();
  const { videoRef, status, error, start, capture } = useCamera();
  const [busy, setBusy] = useState(false);

  const shoot = async () => {
    setBusy(true);
    try {
      const capturedAt = new Date(); // shutter dabane ka time
      const blob = await capture();
      onCapture({ blob, capturedAt });
    } catch {
      /* frame ready nahi tha, user dobara dabayega */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
      />

      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-white">
          <Spinner /> {t('snap.cameraStarting')}
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
          <Alert>{t(ERROR_KEY[error])}</Alert>
          <Button onClick={start}>{t('snap.retry')}</Button>
        </div>
      )}

      <div className="absolute top-3 left-3">{children}</div>

      {status === 'ready' && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <button
            onClick={shoot}
            disabled={busy}
            aria-label={t('snap.shutter')}
            className="h-16 w-16 rounded-full border-4 border-white bg-white/30 transition active:scale-95 disabled:opacity-50"
          />
        </div>
      )}
    </div>
  );
}
