import { useTranslation } from 'react-i18next';
import { VERIFY_THRESHOLD } from '@/lib/mapConfig';

// "x of 10" progress bar. Day 11 ki site sheet me bhi yahi use hoga.
export default function BackersMeter({ count = 0, total = VERIFY_THRESHOLD }) {
  const { t } = useTranslation();
  const shown = Math.min(count, total);
  const pct = Math.round((shown / total) * 100);
  return (
    <div>
      <p className="text-sm font-medium">{t('map.backers', { count: shown, total })}</p>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={shown}
      >
        <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}