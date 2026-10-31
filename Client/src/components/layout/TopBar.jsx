import { Link, NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { navItems } from './navItems';
import ThemeToggle from './ThemeToggle';
import LanguageSwitch from './LanguageSwitch';

export default function TopBar() {
  const { t } = useTranslation();
  const { isAuthed, isAdmin } = useAuth();

  return (
    <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 pt-[env(safe-area-inset-top)] dark:border-slate-800 dark:bg-slate-950">
      <Link to="/" className="flex h-14 items-center text-lg font-bold text-green-600">
        {t('app.name')}
      </Link>

      {/* Desktop nav */}
      <nav className="ml-4 hidden gap-1 md:flex" aria-label="Main">
        {navItems.map(({ to, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center">
        {isAdmin && (
          <Link
            to="/admin"
            aria-label={t('nav.admin')}
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        )}
        <LanguageSwitch />
        <ThemeToggle />
        {!isAuthed && (
          <Link
            to="/login"
            className="ml-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t('nav.login')}
          </Link>
        )}
      </div>
    </header>
  );
}
