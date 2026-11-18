import { useTranslation } from 'react-i18next';

export default function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-green-700 focus:shadow-lg"
    >
      {t('a11y.skip')}
    </a>
  );
}