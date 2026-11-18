import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReviewQueue from './ReviewQueue';
import QueueStats from './QueueStats';
import RepsManager from './RepsManager';
import AreaImport from './AreaImport';

const TABS = [
  { id: 'review', Panel: ReviewQueue },
  { id: 'queue', Panel: QueueStats },
  { id: 'reps', Panel: RepsManager },
  { id: 'areas', Panel: AreaImport },
];

export default function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('review');
  const Active = TABS.find((x) => x.id === tab).Panel;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">{t('pages.admin')}</h1>
      <div role="tablist" aria-label={t('pages.admin')} className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ id }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium ${
              tab === id
                ? 'border-green-600 text-green-700 dark:text-green-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {t(`admin.tabs.${id}`)}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <Active />
      </div>
    </div>
  );
}