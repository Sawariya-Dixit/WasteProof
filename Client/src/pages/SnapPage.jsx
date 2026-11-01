import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from '@/components/report/CameraCapture';
import GpsBadge from '@/components/report/GpsBadge';
import TypeSelect from '@/components/report/TypeSelect';
import NoteInput from '@/components/report/NoteInput';
import UploadProgress from '@/components/report/UploadProgress';
import ReportSaved from '@/components/report/ReportSaved';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useGeolocation } from '@/hooks/useGeolocation';
import { sha256Hex } from '@/lib/hash';
import { MAX_GPS_ACCURACY_M, MAX_UPLOAD_BYTES, inIndia } from '@/lib/snapConfig';
import { createReport, signUpload, uploadToCloudinary } from '@/api/reports';

// Server ke error code se message. Jo yahan nahi hai, wo generic error dikhata hai
const ERROR_KEY = {
  STALE_PHOTO: 'snap.errStale',
  BAD_TIME: 'snap.errStale',
  DUPLICATE_IMAGE: 'snap.errDuplicate',
  RATE_LIMIT: 'snap.errRate',
  UPLOAD_FAILED: 'snap.errUpload',
  NETWORK_ERROR: 'errors.network',
};
// In errors par dobara submit karne ka fayda nahi, photo dobara leni padegi
const FATAL = ['STALE_PHOTO', 'BAD_TIME', 'DUPLICATE_IMAGE', 'FORBIDDEN_KEY'];

export default function SnapPage() {
  const { t } = useTranslation();
  const { position, error } = useGeolocation();

  const [shot, setShot] = useState(null); // { blob, url, capturedAt, gps, sha256 }
  const [type, setType] = useState('');
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState('review'); // review | working | saved
  const [stage, setStage] = useState('upload'); // upload | save
  const [progress, setProgress] = useState(0);
  const [errorKey, setErrorKey] = useState(null);
  const [fatal, setFatal] = useState(false);
  const signRef = useRef(null); // upload ho chuka ho to dobara upload nahi karenge

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

  const reset = () => {
    setShot(null);
    setType('');
    setNote('');
    setPhase('review');
    setProgress(0);
    setErrorKey(null);
    setFatal(false);
    signRef.current = null;
  };

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

  const submit = async () => {
    if (phase === 'working') return;
    setPhase('working');
    setErrorKey(null);
    setFatal(false);
    try {
      if (!signRef.current) {
        setStage('upload');
        setProgress(0);
        const sign = await signUpload();
        await uploadToCloudinary(sign, shot.blob, setProgress);
        signRef.current = sign;
      }
      setStage('save');
      await createReport({
        key: signRef.current.public_id,
        sha256: shot.sha256,
        lat: shot.gps.lat,
        lng: shot.gps.lng,
        accuracyM: shot.gps.accuracyM,
        capturedAt: shot.capturedAt.toISOString(),
        type,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setPhase('saved');
    } catch (err) {
      setErrorKey(ERROR_KEY[err.code] ?? 'errors.generic');
      setFatal(FATAL.includes(err.code));
      setPhase('review');
    }
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

  // ---------- Saved screen ----------
  if (phase === 'saved') {
    return (
      <div className="absolute inset-0 overflow-y-auto">
        <ReportSaved onAnother={reset} />
      </div>
    );
  }

  // ---------- Review + submit screen ----------
  const working = phase === 'working';
  const problems = [];
  if (!shot.gps) problems.push(t('snap.problemNoGps'));
  else {
    if (shot.gps.accuracyM > MAX_GPS_ACCURACY_M)
      problems.push(t('snap.problemPoorGps', { max: MAX_GPS_ACCURACY_M }));
    if (!inIndia(shot.gps.lat, shot.gps.lng)) problems.push(t('snap.problemOutsideIndia'));
  }
  if (shot.blob.size > MAX_UPLOAD_BYTES) problems.push(t('snap.problemTooBig'));
  const canSubmit = problems.length === 0 && !!shot.sha256 && !!type;

  const row = 'flex justify-between gap-4 py-1.5 text-sm';
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <img src={shot.url} alt="" className="max-h-56 w-full bg-black object-contain" />

      <div className="mx-auto w-full max-w-md space-y-4 p-4">
        {problems.map((p) => (
          <Alert key={p}>{p}</Alert>
        ))}
        {errorKey && <Alert>{t(errorKey)}</Alert>}

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
        </dl>

        <TypeSelect value={type} onChange={setType} disabled={working} />
        <NoteInput value={note} onChange={setNote} disabled={working} />

        {working && <UploadProgress stage={stage} progress={progress} />}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={reset} disabled={working}>
            {t('snap.retake')}
          </Button>
          {!fatal && (
            <Button className="flex-1" onClick={submit} loading={working} disabled={!canSubmit}>
              {t('snap.submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}