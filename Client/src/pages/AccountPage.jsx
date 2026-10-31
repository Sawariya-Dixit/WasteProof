import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';

function Choice({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <Button
          key={o.value}
          variant={value === o.value ? 'primary' : 'outline'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export default function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t('account.title')}</h1>

      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <p className="text-sm text-slate-500">{t('auth.email')}</p>
        <p className="font-medium">{user?.email}</p>
        <p className="mt-3 text-sm text-slate-500">{t('account.role')}</p>
        <p className="font-medium">{user?.role}</p>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">{t('common.language')}</h2>
        <Choice
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'हिन्दी' },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{t('common.theme')}</h2>
        <Choice
          value={theme}
          onChange={setTheme}
          options={['light', 'dark', 'system'].map((v) => ({ value: v, label: t(`common.${v}`) }))}
        />
      </section>

      <Button variant="outline" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        {t('auth.logout')}
      </Button>
    </div>
  );
}
