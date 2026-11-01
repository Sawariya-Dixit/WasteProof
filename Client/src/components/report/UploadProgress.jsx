import { useTranslation } from 'react-i18next';

// stage: 'upload' (percent dikhao) ya 'save' (report save ho rahi hai)
export default function UploadProgress({ stage, progress }) {
  const { t } = useTranslation();
  const pct = stage === 'upload' ? Math.round(progress * 100) : 100;
  return (
    <div role="status" aria-live="polite">
      <p className="mb-1.5 text-sm font-medium">
        {stage === 'upload' ? t('snap.uploading', { pct }) : t('snap.saving')}
      </p>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className={`h-full rounded-full bg-green-600 transition-all ${stage === 'save' ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}