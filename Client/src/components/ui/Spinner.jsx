import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
export default function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function FullPageSpinner() {
const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center" role="status" aria-label={t('a11y.loading')}>
      <Spinner className="h-8 w-8 text-green-600" />
    </div>
  );
}
