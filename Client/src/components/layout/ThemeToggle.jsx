import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';

const order = ['light', 'dark', 'system'];
const icons = { light: Sun, dark: Moon, system: Monitor };

// Click par light -> dark -> system -> light
export default function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const Icon = icons[theme];
  const next = order[(order.indexOf(theme) + 1) % order.length];

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`${t('common.theme')}: ${t(`common.${theme}`)}`}
      title={`${t('common.theme')}: ${t(`common.${theme}`)}`}
      className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
