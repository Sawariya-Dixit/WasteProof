import { useTranslation } from 'react-i18next';
import PagePlaceholder from '@/components/ui/PagePlaceholder';

// Day 4: MapLibre yahin aayega (full-screen map, Khategaon par khulega)
export default function MapPage() {
  const { t } = useTranslation();
  return <PagePlaceholder title={t('pages.map')} day="Day 4-5 (F3)" />;
}
