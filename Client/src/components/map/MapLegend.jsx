import { useTranslation } from 'react-i18next';
import { STATUS_COLORS } from '@/lib/mapConfig';

export default function MapLegend() {
  const { t } = useTranslation();
  return (
    <ul className="rounded-lg bg-white/90 px-3 py-2 text-xs shadow dark:bg-slate-900/90">
      {Object.entries(STATUS_COLORS).map(([status, color]) => (
        <li key={status} className="flex items-center gap-2 py-0.5">
          <span
            className="h-3 w-3 rounded-full border border-white"
            style={{ backgroundColor: color }}
          />
          {t(`map.legend.${status}`)}
        </li>
      ))}
    </ul>
  );
}