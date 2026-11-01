import { useTranslation } from 'react-i18next';
import { REPORT_TYPES } from '@/lib/snapConfig';

export default function TypeSelect({ value, onChange, disabled }) {
  const { t } = useTranslation();
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{t('snap.type')}</legend>
      <div className="grid gap-2">
        {REPORT_TYPES.map((k) => (
          <label
            key={k}
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
              value === k
                ? 'border-green-600 bg-green-50 dark:bg-green-950'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="reportType"
              value={k}
              checked={value === k}
              onChange={() => onChange(k)}
              className="accent-green-600"
            />
            {t(`map.types.${k}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}