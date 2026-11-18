import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Alert from './Alert';
import Spinner from './Spinner';

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center py-10" role="status" aria-label={t('a11y.loading')}>
      <Spinner />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <Alert>
      {message ?? t('errors.generic')}{' '}
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline">
          {t('common.retry')}
        </button>
      )}
    </Alert>
  );
}

// cta = { to, label } (optional)
export function EmptyState({ text, cta }) {
  return (
    <div className="space-y-3 py-10 text-center">
      <p className="text-slate-600 dark:text-slate-300">{text}</p>
      {cta && (
        <Link
          to={cta.to}
          className="inline-flex min-h-11 items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}