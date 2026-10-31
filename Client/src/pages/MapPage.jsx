import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MapView from '@/components/map/MapView';
import MapLegend from '@/components/map/MapLegend';
import Spinner from '@/components/ui/Spinner';
import { useBboxSites } from '@/hooks/useBboxSites';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const chip =
  'pointer-events-auto flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm shadow dark:bg-slate-900/90';

export default function MapPage() {
  const { t } = useTranslation();
  const [view, setView] = useState(null); // { bbox, zoom }
  const debouncedView = useDebouncedValue(view, 400); // 400 ms ruko, phir server se maango
  const { sites, tooBig, isFetching, isError, refetch } = useBboxSites(debouncedView?.bbox);

  return (
    <div className="absolute inset-0" >
      <MapView sites={sites} onViewChange={setView} />

      {/* Upar-left: status */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isFetching && (
          <div className={chip}>
            <Spinner className="h-4 w-4" /> {t('map.loading')}
          </div>
        )}
        {!isFetching && tooBig && <div className={chip}>{t('map.zoomIn')}</div>}
        {!isFetching && !tooBig && !isError && debouncedView && (
          <div className={chip}>{t('map.count', { count: sites.length })}</div>
        )}
        {isError && (
          <div className={`${chip} text-red-700 dark:text-red-300`} role="alert">
            {t('map.loadError')}
            <button onClick={() => refetch()} className="font-semibold underline">
              {t('map.retry')}
            </button>
          </div>
        )}
      </div>

      {/* Neeche-left: legend */}
      <div className="pointer-events-none absolute bottom-6 left-3 z-10">
        <MapLegend />
      </div>
    </div>
  );
}