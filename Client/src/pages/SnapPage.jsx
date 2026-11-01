import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from '@/components/report/CameraCapture';
import GpsBadge from '@/components/report/GpsBadge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { sha256Hex } from '@/lib/hash';
import { MAX_GPS_ACCURACY_M, MAX_UPLOAD_BYTES, inIndia } from '@/lib/snapConfig';

export default function SnapPage() {
  const { t } = useTranslation();
  const { position, error } = useGeolocation();
  const [shot, setShot] = useState(null); // { blob, url, capturedAt, gps, sha256 }

  // Shutter dabate waqt ka latest GPS chahiye (closure purana na ho)
  const posRef = useRef(position);
  useEffect(() => {
    posRef.current = position;
  });

  // Preview URL badalne ya page chhodne par memory free karo
  useEffect(() => {
    return () => {
      if (shot?.url) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  const handleCapture = ({ blob, capturedAt }) => {
    setShot({
      blob,
      url: URL.createObjectURL(blob),
      capturedAt,
      gps: posRef.current, // photo ke waqt ki location
      sha256: null,
    });
    sha256Hex(blob)
      .then((h) => setShot((s) => (s && s.blob === blob ? { ...s, sha256: h } : s)))
      .catch(() => {});
  };

  // ---------- Camera screen ----------
  if (!shot) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <CameraCapture onCapture={handleCapture}>
          <GpsBadge position={position} error={error} />
        </CameraCapture>
      </div>
    );
  }

  // ---------- Preview screen ----------
  const problems = [];
  if (!shot.gps) problems.push(t('snap.problemNoGps'));
  else {
    if (shot.gps.accuracyM > MAX_GPS_ACCURACY_M)
      problems.push(t('snap.problemPoorGps', { max: MAX_GPS_ACCURACY_M }));
    if (!inIndia(shot.gps.lat, shot.gps.lng)) problems.push(t('snap.problemOutsideIndia'));
  }
  if (shot.blob.size > MAX_UPLOAD_BYTES) problems.push(t('snap.problemTooBig'));

  const row = 'flex justify-between gap-4 py-1.5 text-sm';
  return (
    <div className="absolute inset-0 flex flex-col overflow-y-auto">
      <img src={shot.url} alt="" className="max-h-[55%] w-full bg-black object-contain" />

      <div className="mx-auto w-full max-w-md space-y-3 p-4">
        {problems.map((p) => (
          <Alert key={p}>{p}</Alert>
        ))}

        <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 px-3 dark:divide-slate-800 dark:border-slate-800">
          <div className={row}>
            <dt className="text-slate-500">{t('snap.location')}</dt>
            <dd>
              {shot.gps
                ? `${shot.gps.lat.toFixed(5)}, ${shot.gps.lng.toFixed(5)} (±${shot.gps.accuracyM} m)`
                : '-'}
            </dd>
          </div>
          <div className={row}>
            <dt className="text-slate-500">{t('snap.takenAt')}</dt>
            <dd>{shot.capturedAt.toLocaleTimeString()}</dd>
          </div>
          <div className={row}>
            <dt className="text-slate-500">{t('snap.size')}</dt>
            <dd>{Math.round(shot.blob.size / 1024)} KB</dd>
          </div>
          <div className={row}>
            <dt className="text-slate-500">{t('snap.fingerprint')}</dt>
            <dd className="font-mono text-xs">
              {shot.sha256 ? `${shot.sha256.slice(0, 16)}…` : <Spinner className="h-4 w-4" />}
            </dd>
          </div>
        </dl>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShot(null)}>
            {t('snap.retake')}
          </Button>
          <Button className="flex-1" disabled={problems.length > 0 || !shot.sha256}>
            {t('snap.continue')}
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400">Upload + submit: Day 8</p>
      </div>
    </div>
  );
}