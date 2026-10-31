import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

export default function ActivityPage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.activity')} day="Day 9 (F11)" />;
}
