import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CloudOff } from 'lucide-react';
import { useQueueStore } from '@/store/queueStore';

export default function QueueBadge() {
  const { t } = useTranslation();
  const count = useQueueStore((s) => s.count);
  const dropped = useQueueStore((s) => s.dropped);
  const clearDropped = useQueueStore((s) => s.clearDropped);
  if (!count && !dropped) return null;

  const warn = dropped > 0;
  return (
    <Link
      to="/activity"
      onClick={clearDropped}
      className={`mr-1 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        warn
          ? 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'
          : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
      }`}
    >
      <CloudOff className="h-3.5 w-3.5" />
      {warn ? t('queue.dropped', { n: dropped }) : t('queue.waiting', { n: count })}
    </Link>
  );
}