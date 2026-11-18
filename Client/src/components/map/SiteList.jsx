import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import StatusChip from '@/components/site/StatusChip';
import BackersMeter from '@/components/site/BackersMeter';
import { EmptyState } from '@/components/ui/StateViews';

// Map ke upar list view: abhi box me jo sites hain, zyada backers wali pehle
export default function SiteList({ sites }) {
  const { t } = useTranslation();
  if (!sites.length) {
    return <EmptyState text={t('map.listEmpty')} cta={{ to: '/snap', label: t('map.addReport') }} />;
  }
  const sorted = [...sites].sort(
    (a, b) =>
      (b.backerCount ?? 0) - (a.backerCount ?? 0) ||
      new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
  );
  return (
    <ul className="mx-auto max-w-2xl space-y-3 p-3">
      {sorted.map((s) => (
        <li key={s._id}>
          <Link
            to={`/site/${s._id}`}
            className="block rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {t(`map.types.${s.type}`, { defaultValue: s.type })}
              </h3>
              <StatusChip status={s.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('map.reportsCount', { count: s.reportCount ?? 0 })}
            </p>
            <div className="mt-2">
              <BackersMeter count={s.backerCount ?? 0} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}