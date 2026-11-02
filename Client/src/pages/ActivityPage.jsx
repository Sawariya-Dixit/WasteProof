import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import ReportCard from '@/components/report/ReportCard';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { useMyReports } from '@/hooks/useMyReports';

export default function ActivityPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyReports();

  return (
    <div className="mx-auto w-full max-w-md space-y-3 p-4">
      <h1 className="text-xl font-semibold">{t('pages.activity')}</h1>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {isError && (
        <Alert>
          {t('activity.loadError')}{' '}
          <button onClick={() => refetch()} className="font-semibold underline">
            {t('map.retry')}
          </button>
        </Alert>
      )}

      {data?.length === 0 && (
        <div className="space-y-3 py-10 text-center">
          <p className="text-slate-600 dark:text-slate-300">{t('activity.empty')}</p>
          <Link
            to="/snap"
            className="inline-flex min-h-11 items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t('activity.emptyCta')}
          </Link>
        </div>
      )}

      {data?.map((r) => <ReportCard key={r.id} report={r} />)}
    </div>
  );
}