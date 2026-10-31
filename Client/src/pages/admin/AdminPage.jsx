import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

export default function AdminPage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.admin')} day="Day 22-23 (F13)" />;
}
