import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation();
  const cards = ['city', 'citizen', 'bin'];
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{t('about.title')}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{t('about.intro')}</p>
      <div className="mt-6 grid gap-3">
        {cards.map((c) => (
          <div key={c} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-semibold">{t(`about.${c}Title`)}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t(`about.${c}Text`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
