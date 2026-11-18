import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useHtmlLang() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage?.startsWith('hi') ? 'hi' : 'en';
  }, [i18n.resolvedLanguage]);
}