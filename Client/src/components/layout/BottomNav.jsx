import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { navItems } from './navItems';

// Sirf mobile par (md se upar chhup jata hai)
export default function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      className="border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-950"
      aria-label="Main"
    >
      <ul className="flex">
        {navItems.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive ? 'text-green-600' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
