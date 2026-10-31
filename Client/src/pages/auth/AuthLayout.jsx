import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from '@/components/layout/LanguageSwitch';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function AuthLayout({ title, hint, children, footer }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-end pt-2">
        <LanguageSwitch />
        <ThemeToggle />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
        <Link to="/" className="mb-1 text-center text-3xl font-bold text-green-600">
          {t('app.name')}
        </Link>
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('app.tagline')}
        </p>
        <h1 className="text-xl font-semibold">{title}</h1>
        {hint && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>}
        <div className="mt-4 space-y-4">{children}</div>
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
