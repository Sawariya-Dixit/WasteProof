import { useTranslation } from 'react-i18next';

const TONE = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  passed: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
  community_check: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  needs_reporter_confirm: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  needs_review: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

export default function ReportStatusChip({ status }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TONE[status] ?? TONE.needs_review}`}
    >
      {t(`activity.status.${status}`, { defaultValue: status })}
    </span>
  );
}