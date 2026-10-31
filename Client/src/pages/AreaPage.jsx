import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

export default function AreaPage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.area')} day="Day 16 (F9)" />;
}
