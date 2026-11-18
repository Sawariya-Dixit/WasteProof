import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Signal } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Offline: hamesha dikhta hai. Slow: ek baar band kar sakte ho.
export default function NetworkBanner() {
  const { t } = useTranslation();
  const status = useNetworkStatus();
  const [hideSlow, setHideSlow] = useState(false);

  if (status === 'ok' || (status === 'slow' && hideSlow)) return null;
  const offline = status === 'offline';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 px-3 py-2 text-sm print:hidden ${
        offline
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
          : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
      }`}
    >
      {offline ? <WifiOff className="h-4 w-4 shrink-0" /> : <Signal className="h-4 w-4 shrink-0" />}
      <span className="flex-1">{t(offline ? 'network.offline' : 'network.slow')}</span>
      {!offline && (
        <button onClick={() => setHideSlow(true)} className="min-h-11 px-2 font-medium underline">
          {t('network.dismiss')}
        </button>
      )}
    </div>
  );
}