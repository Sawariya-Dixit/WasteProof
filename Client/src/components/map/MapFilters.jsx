import { useTranslation } from 'react-i18next';
import { REPORT_TYPES } from '@/lib/snapConfig';

const STATUSES = ['unverified', 'verified', 'cleaned'];

const select =
  'pointer-events-auto min-h-9 min-w-0 max-w-[8.5rem] truncate rounded-lg bg-white/90 px-2 py-1 text-sm shadow sm:max-w-none dark:bg-slate-900/90 dark:text-slate-100';

// value = { type: '', status: '' }  ('' = sab). onChange(naya value)
export default function MapFilters({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 gap-2">
      <select
        className={select}
        aria-label={t('map.filterType')}
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value })}
      >
        <option value="">{t('map.allTypes')}</option>
        {REPORT_TYPES.map((ty) => (
          <option key={ty} value={ty}>
            {t(`map.types.${ty}`)}
          </option>
        ))}
      </select>
      <select
        className={select}
        aria-label={t('map.filterStatus')}
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value })}
      >
        <option value="">{t('map.allStatuses')}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`map.status.${s}`)}
          </option>
        ))}
      </select>
    </div>
  );
}