import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { MAX_GPS_ACCURACY_M } from '@/lib/snapConfig';

const ERROR_KEY = {
  denied: 'snap.gpsDenied',
  unavailable: 'snap.gpsUnavailable',
  unsupported: 'snap.gpsUnsupported',
  timeout: 'snap.gpsTimeout',
};

export default function GpsBadge({ position, error }) {
  const { t } = useTranslation();
  let tone = 'bg-slate-800/80 text-white';
  let text = t('snap.gpsLocating');

  if (position) {
    const good = position.accuracyM <= MAX_GPS_ACCURACY_M;
    tone = good ? 'bg-green-600/90 text-white' : 'bg-amber-400/95 text-black';
    text = t(good ? 'snap.gpsGood' : 'snap.gpsPoor', { m: position.accuracyM });
  } else if (error) {
    tone = 'bg-red-600/90 text-white';
    text = t(ERROR_KEY[error]);
  }

  return (
    <span
      role="status"
      className={`inline-flex max-w-[80vw] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${tone}`}
    >
      <MapPin className="h-4 w-4 shrink-0" />
      {text}
    </span>
  );
}
