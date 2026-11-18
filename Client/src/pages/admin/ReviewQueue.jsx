import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { FullPageSpinner } from '@/components/ui/Spinner';
import ReportStatusChip from '@/components/report/ReportStatusChip';
import { actOnReport, fetchReviewReports } from '@/api/admin';
import { adminErrorText } from './adminErrors';

const LIMIT = 10;

function Row({ label, children }) {
  if (children == null || children === '') return null;
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  );
}

function ReviewCard({ r }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const act = useMutation({
    mutationFn: (action) => actOnReport(r.id, { action, ...(reason.trim() ? { reason: reason.trim() } : {}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
  const needReason = reason.trim().length < 3;
  const { lat, lng } = r.location;

  return (
    <li className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex gap-3">
        {r.blurredUrl ? (
          <img src={r.blurredUrl} alt="" loading="lazy" className="h-28 w-28 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100 p-2 text-center text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {t('admin.review.noPhoto')}
          </div>
        )}
        <dl className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{t(`map.types.${r.type}`, { defaultValue: r.type })}</span>
            <ReportStatusChip status={r.status} />
          </div>
          <Row label={t('admin.review.reasonCode')}>{r.reason}</Row>
          <Row label={t('admin.review.failedStep')}>{r.failedStep}</Row>
          <Row label={t('admin.review.attempts')}>{r.attempts || null}</Row>
          <Row label={t('admin.review.aiProbability')}>
            {r.verify?.probability != null ? `${Math.round(r.verify.probability * 100)}%` : null}
          </Row>
          <Row label={t('admin.review.aiNote')}>{r.verify?.llmReason}</Row>
          <Row label={t('admin.review.lastError')}>{r.lastError}</Row>
          <Row label={t('admin.review.when')}>{new Date(r.createdAt).toLocaleString()}</Row>
        </dl>
      </div>

      {r.note && <p className="rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-900">{r.note}</p>}

      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm text-green-700 underline dark:text-green-400"
      >
        <ExternalLink className="h-4 w-4" /> {t('admin.review.openMap')}
      </a>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 300))}
        rows={2}
        placeholder={t('admin.review.reasonPlaceholder')}
        aria-label={t('admin.review.reason')}
        className="w-full rounded-lg border border-slate-300 bg-transparent p-2.5 text-sm dark:border-slate-700"
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.review.approveHint')}</p>

      <div className="flex flex-wrap gap-2">
        <Button loading={act.isPending && act.variables === 'approve'} disabled={needReason || act.isPending} onClick={() => act.mutate('approve')}>
          {t('admin.review.approve')}
        </Button>
        <Button variant="outline" loading={act.isPending && act.variables === 'reject'} disabled={needReason || act.isPending} onClick={() => act.mutate('reject')}>
          {t('admin.review.reject')}
        </Button>
        {r.status === 'needs_review' && (
          <Button variant="ghost" loading={act.isPending && act.variables === 'retry'} disabled={act.isPending} onClick={() => act.mutate('retry')}>
            {t('admin.review.retry')}
          </Button>
        )}
      </div>
      {act.isError && <Alert>{adminErrorText(act.error, t)}</Alert>}
    </li>
  );
}

export default function ReviewQueue() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['admin', 'reports', status, page],
    queryFn: () => fetchReviewReports({ page, limit: LIMIT, ...(status ? { status } : {}) }),
    placeholderData: (prev) => prev,
  });

  if (q.isLoading) return <FullPageSpinner />;
  if (q.isError) return <Alert>{adminErrorText(q.error, t)}</Alert>;

  const { reports, meta } = q.data;
  const pages = Math.max(1, Math.ceil(meta.total / LIMIT));

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm" htmlFor="rq-status">{t('admin.review.filter')}</label>
        <select
          id="rq-status"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">{t('admin.review.all')}</option>
          <option value="needs_review">{t('activity.status.needs_review')}</option>
          <option value="community_check">{t('activity.status.community_check')}</option>
        </select>
        <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">{t('admin.review.total', { count: meta.total })}</span>
      </div>

      {reports.length === 0 ? (
        <p className="py-10 text-center text-slate-500 dark:text-slate-400">{t('admin.review.empty')}</p>
      ) : (
        <ul className="space-y-3">{reports.map((r) => <ReviewCard key={r.id} r={r} />)}</ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('admin.prev')}</Button>
          <span className="text-sm">{t('admin.page', { page, pages })}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>{t('admin.next')}</Button>
        </div>
      )}
    </section>
  );
}