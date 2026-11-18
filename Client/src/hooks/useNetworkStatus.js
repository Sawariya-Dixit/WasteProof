import { useSyncExternalStore } from 'react';

// 'offline' | 'slow' | 'ok'. Slow = 2G, data-saver ya bahut zyada delay (sirf Chrome/Android batata hai).
function read() {
  if (!navigator.onLine) return 'offline';
  const c = navigator.connection;
  if (c && (c.saveData || ['slow-2g', '2g'].includes(c.effectiveType) || c.rtt > 1500)) return 'slow';
  return 'ok';
}

function subscribe(cb) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  navigator.connection?.addEventListener('change', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
    navigator.connection?.removeEventListener('change', cb);
  };
}

export function useNetworkStatus() {
  return useSyncExternalStore(subscribe, read, () => 'ok');
}