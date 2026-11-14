import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { VERIFY_THRESHOLD } from '@/lib/mapConfig';

// Map par circle par tap karne par neeche aane wala card. zone = feature properties (nobinGeo.js)
export default function NobinZoneCard({ zone, onClose }) {
  const { t } = useTranslation();
  const shown = Math.min(zone.backerCount ?? 0, VERIFY_THRESHOLD);
  const pct = Math.round((shown / VERIFY_THRESHOLD) * 100);

  let evidence;
  if (!zone.binChecked) evidence = t('nobin.bin.checking');
  else if (zone.binFound) {
    const kind = t(`nobin.bin.kind.${zone.binKind}`, { defaultValue: t('nobin.bin.kind.waste_basket') });
    evidence = zone.binName
      ? t('nobin.bin.foundNamed', { kind, name: zone.binName, m: zone.binDistanceM })
      : t('nobin.bin.found', { kind, m: zone.binDistanceM });
  } else evidence = t('nobin.bin.none');

  return (
    <section
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 mx-auto max-w-md rounded-2xl bg-white p-4 shadow-lg dark:bg-slate-900"
      aria-label={t('nobin.cardTitle')}
    >
      <button
        onClick={onClose}
        aria-label={t('map.close')}
        className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X className="h-5 w-5" />
      </button>

      <h2 className="pr-10 text-base font-semibold">{t('nobin.cardTitle')}</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {t(`nobin.status.${zone.status}`, { total: VERIFY_THRESHOLD })}
      </p>

      <div className="mt-3">
        <p className="text-sm font-medium">{t('nobin.peopleSay', { count: shown, total: VERIFY_THRESHOLD })}</p>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={VERIFY_THRESHOLD}
          aria-valuenow={shown}
        >
          <div className="h-full rounded-full bg-violet-600" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{evidence}</p>
      {zone.binChecked && !zone.binFound && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('nobin.bin.osmNote')}</p>
      )}

      <Link
        to="/nobin"
        className="mt-4 block rounded-lg bg-violet-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-violet-700"
      >
        {t('nobin.alsoNoBin')}
      </Link>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('nobin.approxNote')}</p>
    </section>
  );
}