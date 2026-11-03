import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Check, CloudOff } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ReportSaved({ onAnother, queued = false }) {
  const { t } = useTranslation();
  const Icon = queued ? CloudOff : Check;
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          queued
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
        }`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-semibold">{t(queued ? 'snap.queuedTitle' : 'snap.savedTitle')}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t(queued ? 'snap.queuedText' : 'snap.savedText')}
      </p>
      <div className="flex w-full flex-col gap-2">
        <Button onClick={onAnother}>{t('snap.snapAnother')}</Button>
        <Link
          to="/activity"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {t('snap.viewReports')}
        </Link>
        <Link to="/" className="py-2 text-sm text-slate-500 underline">
          {t('snap.backToMap')}
        </Link>
      </div>
    </div>
  );
}