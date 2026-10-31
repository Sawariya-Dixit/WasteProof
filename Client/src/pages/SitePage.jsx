import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

export default function SitePage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.site')} day="Day 11 (F6)" />;
}
