import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { scoreColor } from '@/lib/areaGeo';

import { AREA_MIN_VERIFIED } from '@/lib/mapConfig';

export default function AreaRankList({ areas, selectedId, onSelect }) {
  const { t } = useTranslation();

  return (
    <ol className="space-y-2">
      {areas.map((a) => {
        const selected = a.id === selectedId;
        const pct = Math.round((Math.min(a.verifiedCount, AREA_MIN_VERIFIED) / AREA_MIN_VERIFIED) * 100);
        return (
          <li key={a.id}>
            <div
              className={`rounded-xl border p-3 ${
                selected ? 'border-blue-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="flex min-h-11 w-full items-start gap-3 text-left"
              >
                <span
                  className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full px-2 text-sm font-bold text-white"
                  style={{ backgroundColor: scoreColor(a.scoreVisible ? a.overallScore : null) }}
                  aria-label={t('areas.overall')}
                >
                  {a.scoreVisible ? (a.overallScore ?? '–') : '–'}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {a.rank ? `#${a.rank} ` : ''}
                    {a.name}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{a.state}</span>

                  {a.scoreVisible ? (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                      {t(`areas.diagnosis.${a.diagnosis}`, { defaultValue: a.diagnosis })}
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      {t('areas.withheld')}
                    </span>
                  )}
                </span>
              </button>

              {/* Counts hamesha dikhte hain, score withheld ho tab bhi */}
              <div className="mt-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t('areas.verifiedOf', { count: a.verifiedCount, total: AREA_MIN_VERIFIED })} ·{' '}
                  {t('areas.sitesTotal', { count: a.totalCount })}
                </p>
                {!a.scoreVisible && (
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={AREA_MIN_VERIFIED}
                    aria-valuenow={Math.min(a.verifiedCount, AREA_MIN_VERIFIED)}
                  >
                    <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>

              <Link
                to={`/area/${a.id}`}
                className="mt-2 inline-block text-sm font-medium text-green-700 underline dark:text-green-400"
              >
                {t('areas.viewArea')}
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}