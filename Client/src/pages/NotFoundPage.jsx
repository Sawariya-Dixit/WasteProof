import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-2xl font-bold">{t('pages.notFound')}</h1>
      <Link to="/" className="mt-4 inline-block font-medium text-green-600">
        {t('pages.goHome')}
      </Link>
    </div>
  );
}
