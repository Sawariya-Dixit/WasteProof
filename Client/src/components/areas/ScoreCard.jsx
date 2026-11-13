import { useTranslation } from 'react-i18next';
import { scoreColor } from '@/lib/areaGeo';

// value = 0-100 (zyada = behtar) ya null (data kam hai)
export default function ScoreCard({ label, hint, value }) {
  const { t } = useTranslation();
  const has = typeof value === 'number';

  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>

      {has ? (
        <>
          <p className="mt-2 text-2xl font-bold" style={{ color: scoreColor(value) }}>
            {value}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> / 100</span>
          </p>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${value}%`, backgroundColor: scoreColor(value) }}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('areas.scoreNoData')}</p>
      )}
    </div>
  );
}