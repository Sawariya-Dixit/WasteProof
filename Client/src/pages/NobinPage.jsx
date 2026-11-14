import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useReportNobin } from '@/hooks/useNobin';
import { inIndia } from '@/lib/snapConfig';
import { NOBIN_MAX_ACCURACY_M, NOBIN_RADIUS_M } from '@/lib/nobinConfig';
import { VERIFY_THRESHOLD } from '@/lib/mapConfig';

const GPS_ERROR = {
  denied: 'snap.gpsDenied',
  unavailable: 'snap.gpsUnavailable',
  unsupported: 'snap.gpsUnsupported',
  timeout: 'snap.gpsTimeout',
};

export default function NobinPage() {
  const { t } = useTranslation();
  const { position, error } = useGeolocation();
  const report = useReportNobin();
  const [sure, setSure] = useState(false);

  // Submit ke waqt ka latest GPS (closure purana na ho)
  const posRef = useRef(position);
  useEffect(() => {
    posRef.current = position;
  });

  const back = (
    <Link
      to="/"
      className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('snap.backToMap')}
    </Link>
  );

  // ---------- Result screen ----------
  if (report.isSuccess) {
    const { zone, joined } = report.data;
    const shown = Math.min(zone.backerCount, VERIFY_THRESHOLD);
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-semibold">{t(joined ? 'nobin.joinedTitle' : 'nobin.newTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {zone.status === 'verified'
            ? t('nobin.verifiedText', { total: VERIFY_THRESHOLD })
            : t(joined ? 'nobin.joinedText' : 'nobin.newText', { count: shown, total: VERIFY_THRESHOLD })}
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {t('nobin.seeOnMap')}
        </Link>
      </div>
    );
  }

  // ---------- Form screen ----------
  const problems = [];
  if (error) problems.push(t(GPS_ERROR[error]));
  else if (!position) problems.push(t('snap.gpsLocating'));
  else {
    if (position.accuracyM > NOBIN_MAX_ACCURACY_M) {
      problems.push(t('nobin.problemPoorGps', { max: NOBIN_MAX_ACCURACY_M }));
    }
    if (!inIndia(position.lat, position.lng)) problems.push(t('snap.problemOutsideIndia'));
  }
  const canSubmit = problems.length === 0 && sure;

  const submit = () => {
    const p = posRef.current;
    if (!p || report.isPending) return;
    report.mutate({ lat: p.lat, lng: p.lng, accuracyM: p.accuracyM });
  };

  const errorText = (err) => {
    switch (err?.code) {
      case 'GPS_TOO_WEAK':
        return t('nobin.err.GPS_TOO_WEAK', { m: err.details?.maxM ?? NOBIN_MAX_ACCURACY_M });
      case 'ALREADY_REPORTED':
      case 'NETWORK_ERROR':
      case 'HTTP_429':
        return t(`nobin.err.${err.code}`);
      default:
        return t('errors.generic');
    }
  };

  const gpsGood = position && position.accuracyM <= NOBIN_MAX_ACCURACY_M;

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4">
      {back}

      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t('nobin.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('nobin.intro', { km: NOBIN_RADIUS_M / 1000, total: VERIFY_THRESHOLD })}
        </p>
      </header>

      <p
        role="status"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
          gpsGood
            ? 'bg-green-600/90 text-white'
            : position
              ? 'bg-amber-400/95 text-black'
              : 'bg-slate-800/80 text-white'
        }`}
      >
        <MapPin className="h-4 w-4 shrink-0" />
        {position ? t(gpsGood ? 'snap.gpsGood' : 'snap.gpsPoor', { m: position.accuracyM }) : t('snap.gpsLocating')}
      </p>

      {problems.map((p) => (
        <Alert key={p}>{p}</Alert>
      ))}
      {report.isError && <Alert>{errorText(report.error)}</Alert>}

      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700">
        <input
          type="checkbox"
          checked={sure}
          onChange={(e) => setSure(e.target.checked)}
          disabled={report.isPending}
          className="mt-0.5 h-5 w-5 accent-violet-600"
        />
        <span>{t('nobin.confirm', { km: NOBIN_RADIUS_M / 1000 })}</span>
      </label>

      <Button className="w-full" onClick={submit} loading={report.isPending} disabled={!canSubmit}>
        {t('nobin.submit')}
      </Button>

      <p className="text-xs text-slate-500 dark:text-slate-400">{t('nobin.privacy')}</p>
    </div>
  );
}