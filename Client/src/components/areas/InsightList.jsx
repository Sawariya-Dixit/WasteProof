import { useTranslation } from 'react-i18next';

// Server { code, params } bhejta hai, text yahin i18n se banta hai
export default function InsightList({ insights }) {
  const { t } = useTranslation();
  if (!insights?.length) return null;

  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
      {insights.map((i, n) => (
        <li key={`${i.code}-${n}`}>
          {t(`areas.insight.${i.code}`, { ...i.params, defaultValue: i.code })}
        </li>
      ))}
    </ul>
  );
}