import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import StatusChip from '@/components/site/StatusChip';
import BackersMeter from '@/components/site/BackersMeter';

// Pin par tap karne par neeche aane wala card
export default function SitePinCard({ site, onClose }) {
  const { t } = useTranslation();
  return (
    <section
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 mx-auto max-w-md rounded-2xl bg-white p-4 shadow-lg dark:bg-slate-900"
      aria-label={t(`map.types.${site.type}`, { defaultValue: site.type })}
    >
      <button
        onClick={onClose}
        aria-label={t('map.close')}
        className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X className="h-5 w-5" />
      </button>

      <h2 className="pr-10 text-base font-semibold">
        {t(`map.types.${site.type}`, { defaultValue: site.type })}
      </h2>

      <div className="mt-2 flex items-center gap-2">
        <StatusChip status={site.status} />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('map.reportsCount', { count: site.reportCount ?? 0 })}
        </span>
      </div>

      <div className="mt-3">
        <BackersMeter count={site.backerCount ?? 0} />
      </div>

      <Link
        to={`/site/${site.id}`}
        className="mt-4 block rounded-lg bg-green-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700"
      >
        {t('map.viewDetails')}
      </Link>
    </section>
  );
}