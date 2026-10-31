import { useTranslation } from 'react-i18next';

// Jo screens abhi nahi bani unke liye. Jaise-jaise banti jayein, page se hata do.
export default function PagePlaceholder({ title, day }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{t('common.comingSoon')}</p>
      {day && <p className="mt-1 text-xs text-slate-400">Plan: {day}</p>}
    </div>
  );
}
