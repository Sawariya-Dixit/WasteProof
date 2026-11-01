import { useTranslation } from 'react-i18next';
import { STATUS_COLORS } from '@/lib/mapConfig';

export default function StatusChip({ status }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-slate-800">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] ?? STATUS_COLORS.unverified }}
      />
      {t(`map.status.${status}`, { defaultValue: status })}
    </span>
  );
}