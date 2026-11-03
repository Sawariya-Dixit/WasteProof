import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Check, Circle } from 'lucide-react';
import ReportStatusChip from '@/components/report/ReportStatusChip';
import ConfirmPrompt from '@/components/report/ConfirmPrompt';
import Spinner from '@/components/ui/Spinner';
import { isRunning, useReportDetail } from '@/hooks/useMyReports';
import { thumbUrl } from '@/lib/image';

export default function ReportCard({ report }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const running = isRunning(report);
  const detail = useReportDetail(report.id, { enabled: open, running: open && running });

  const progressText =
    report.status !== 'pending'
      ? null
      : running
        ? t('activity.checking', { done: report.progress.done, total: report.progress.total })
        : t('activity.allDone');

  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-800">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        {report.blurredUrl ? (
          <img
            src={thumbFailed ? report.blurredUrl : thumbUrl(report.blurredUrl)}
            onError={() => setThumbFailed(true)}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg bg-slate-200 object-cover dark:bg-slate-800"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            {running && <Spinner className="h-5 w-5" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {t(`map.types.${report.type}`, { defaultValue: report.type })}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(report.createdAt).toLocaleString(i18n.language)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ReportStatusChip status={report.status} />
            {progressText && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{progressText}</span>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 p-3 text-sm dark:border-slate-800">
          {report.status === 'rejected' && report.rejectReason && (
            <p className="text-red-700 dark:text-red-300">
              {t(`activity.reject.${report.rejectReason}`, { defaultValue: report.rejectReason })}
            </p>
          )}
          {report.status === 'needs_review' && <p>{t('activity.failed')}</p>}
          {report.status === 'needs_reporter_confirm' && <ConfirmPrompt report={report} />}
          {report.siteId && (
            <Link
              to={`/site/${report.siteId}`}
              className="inline-block font-medium text-green-700 underline dark:text-green-400"
            >
              {t('activity.viewSite')}
            </Link>
          )}

          {detail.isLoading && <Spinner className="h-4 w-4" />}
          {detail.isError && <p className="text-red-700 dark:text-red-300">{t('activity.detailsError')}</p>}

          {detail.data && (
            <>
              <div>
                <p className="mb-1.5 font-medium">{t('activity.details')}</p>
                <ul className="space-y-1.5">
                  {detail.data.checks.map((c) => (
                    <li key={c.name} className="flex items-center gap-2">
                      {c.done ? (
                        <Check className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <span className={c.done ? '' : 'text-slate-500 dark:text-slate-400'}>
                        {t(`activity.steps.${c.name}`, { defaultValue: c.name })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {detail.data.facesBlurred !== null && (
                <p className="text-slate-600 dark:text-slate-300">
                  {t('activity.blurred', {
                    faces: detail.data.facesBlurred,
                    plates: detail.data.platesBlurred ?? 0,
                  })}
                </p>
              )}
              {detail.data.blurredUrl && (
                <a
                  href={detail.data.blurredUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-green-700 underline dark:text-green-400"
                >
                  {t('activity.openPhoto')}
                </a>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}