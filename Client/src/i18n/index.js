import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import { useUiStore } from '@/store/uiStore';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: useUiStore.getState().language,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React khud escape karta hai
});

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (l) => {
  document.documentElement.lang = l;
});

export default i18n;
