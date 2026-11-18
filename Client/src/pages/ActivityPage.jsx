import { useTranslation } from 'react-i18next';
import ReportCard from '@/components/report/ReportCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useMyReports } from '@/hooks/useMyReports';

export default function ActivityPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyReports();

  return (
    <div className="mx-auto w-full max-w-md space-y-3 p-4">
      <h1 className="text-xl font-semibold">{t('pages.activity')}</h1>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={t('activity.loadError')} onRetry={refetch} />}
      {data?.length === 0 && <EmptyState text={t('activity.empty')} cta={{ to: '/snap', label: t('activity.emptyCta') }} />}
      {data?.map((r) => <ReportCard key={r.id} report={r} />)}
    </div>
  );
}