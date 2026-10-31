import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';

export default function LanguageSwitch() {
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
      aria-label={t('common.language')}
      title={t('common.language')}
      className="flex h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <Languages className="h-5 w-5" />
      {language === 'en' ? 'हिं' : 'EN'}
    </button>
  );
}
