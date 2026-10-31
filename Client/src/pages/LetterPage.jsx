import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

export default function LetterPage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.letter')} day="Day 17 (F10)" />;
}
