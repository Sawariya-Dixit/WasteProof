import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import CameraCapture from '@/components/report/CameraCapture';
import UploadProgress from '@/components/report/UploadProgress';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useSite, siteKey } from '@/hooks/useSite';
import { signUpload, uploadToCloudinary } from '@/api/reports';
import { claimCleanup } from '@/api/sites';
import { getPositionOnce } from '@/lib/geo';

const GEO_ERRORS = ['denied', 'unavailable', 'timeout', 'unsupported'];

// "Ye site saaf ho gayi": site ke paas jaakar after-photo lo
export default function CleanupPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: site } = useSite(id);

  const [shot, setShot] = useState(null); // { blob, url }
  const [phase, setPhase] = useState('review'); // review | working | done
  const [stage, setStage] = useState('upload');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null); // accepted | rejected | claimed
  const [errorText, setErrorText] = useState(null);

  useEffect(() => {
    return () => {
      if (shot?.url) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  const retake = () => {
    setShot(null);
    setPhase('review');
    setResult(null);
    setErrorText(null);
    setProgress(0);
  };

  const errorMessage = (err) => {
    if (GEO_ERRORS.includes(err?.message)) return t(`vote.err.${err.message}`);
    switch (err?.code) {
      case 'TOO_FAR':
        return t('vote.err.TOO_FAR', { m: err.details?.maxM ?? 300, d: err.details?.distanceM ?? '?' });
      case 'GPS_TOO_WEAK':
        return t('vote.err.GPS_TOO_WEAK', { m: err.details?.maxM ?? 100 });
      case 'SITE_CLOSED':
      case 'NETWORK_ERROR':
        return t(`vote.err.${err.code}`);
      case 'UNSAFE_IMAGE':
        return t('cleanup.errUnsafe');
      default:
        return t('errors.generic');
    }
  };

  const submit = async () => {
    if (phase === 'working') return;
    setPhase('working');
    setErrorText(null);
    try {
      const pos = await getPositionOnce(); // photo ke saath abhi ki location
      setStage('upload');
      setProgress(0);
      const sign = await signUpload();
      await uploadToCloudinary(sign, shot.blob, setProgress);
      setStage('save');
      const data = await claimCleanup(id, { key: sign.public_id, ...pos });
      qc.invalidateQueries({ queryKey: siteKey(id) });
      qc.invalidateQueries({ queryKey: ['sites'] });
      setResult(data.cleanup.status);
      setPhase('done');
    } catch (err) {
      setErrorText(errorMessage(err));
      setPhase('review');
    }
  };

  if (site && !['unverified', 'verified'].includes(site.status)) {
    return (
      <div className="mx-auto w-full max-w-md space-y-3 p-4">
        <Alert>{t('cleanup.siteClosed')}</Alert>
        <Link to={`/site/${id}`} className="text-green-700 underline dark:text-green-400">
          {t('cleanup.viewSite')}
        </Link>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-4">
        <h1 className="text-xl font-semibold">{t(`cleanup.result.${result}.title`)}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t(`cleanup.result.${result}.text`)}</p>
        <div className="flex gap-2">
          {result === 'rejected' && (
            <Button variant="outline" className="flex-1" onClick={retake}>
              {t('cleanup.retake')}
            </Button>
          )}
          <Link
            to={`/site/${id}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700"
          >
            {t('cleanup.viewSite')}
          </Link>
        </div>
      </div>
    );
  }

  if (!shot) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <p className="bg-black/80 px-4 py-2 text-center text-sm text-white">{t('cleanup.hint')}</p>
        <CameraCapture onCapture={({ blob }) => setShot({ blob, url: URL.createObjectURL(blob) })} />
      </div>
    );
  }

  const working = phase === 'working';
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <img src={shot.url} alt="" className="max-h-72 w-full bg-black object-contain" />
      <div className="mx-auto w-full max-w-md space-y-4 p-4">
        {errorText && <Alert>{errorText}</Alert>}
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('cleanup.review')}</p>
        {working && <UploadProgress stage={stage} progress={progress} />}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={retake} disabled={working}>
            {t('cleanup.retake')}
          </Button>
          <Button className="flex-1" onClick={submit} loading={working}>
            {t('cleanup.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}