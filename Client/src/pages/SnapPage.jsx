import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

export default function SnapPage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.snap')} day="Day 6 (F4)" />;
}
