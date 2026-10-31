import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

export default function AreasPage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.areas')} day="Day 15 (F9)" />;
}
