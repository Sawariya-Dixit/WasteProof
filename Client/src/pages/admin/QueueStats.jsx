import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { fetchQueueStats } from '@/api/admin';
import { adminErrorText } from './adminErrors';

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 p-3 text-center dark:border-slate-800">
    <div className="text-2xl font-bold">{value ?? 0}</div>
    <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
  </div>
);

export default function QueueStats() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchQueueStats, refetchInterval: 60_000 });

  if (q.isLoading) return <FullPageSpinner />;
  if (q.isError) return <Alert>{adminErrorText(q.error, t)}</Alert>;
  const { jobs, failed, reports } = q.data;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t('admin.queue.jobs')}</h2>
        <Button variant="outline" onClick={() => q.refetch()} loading={q.isFetching}>{t('admin.queue.refresh')}</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {['waiting', 'active', 'delayed', 'completed', 'failed'].map((k) => (
          <Stat key={k} label={t(`admin.queue.${k}`)} value={jobs[k]} />
        ))}
      </div>

      <h2 className="font-semibold">{t('admin.queue.reports')}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(reports).map(([s, n]) => (
          <Stat key={s} label={t(`activity.status.${s}`, { defaultValue: s })} value={n} />
        ))}
      </div>

      <h2 className="font-semibold">{t('admin.queue.failedJobs')}</h2>
      {failed.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.queue.noFailed')}</p>
      ) : (
        <ul className="space-y-2">
          {failed.map((j) => (
            <li key={`${j.reportId}-${j.at}`} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
              <div className="font-mono text-xs">{j.reportId}</div>
              <div>{j.reason}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('admin.review.attempts')}: {j.attempts}
                {j.at ? ` · ${new Date(j.at).toLocaleString()}` : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}