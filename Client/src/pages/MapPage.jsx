import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Ban } from 'lucide-react';
import MapView from '@/components/map/MapView';
import MapLegend from '@/components/map/MapLegend';
import SitePinCard from '@/components/map/SitePinCard';
import NobinZoneCard from '@/components/nobin/NobinZoneCard';
import Spinner from '@/components/ui/Spinner';
import { useBboxSites } from '@/hooks/useBboxSites';
import { useNobinZones } from '@/hooks/useNobin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const chip =
  'pointer-events-auto flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm shadow dark:bg-slate-900/90';

export default function MapPage() {
  const { t } = useTranslation();
  const [view, setView] = useState(null); // { bbox, zoom }
  const [selected, setSelected] = useState(null); // pin jis par tap kiya
  const [selectedZone, setSelectedZone] = useState(null); // no-bin circle jis par tap kiya
  const debouncedView = useDebouncedValue(view, 400); // 400 ms ruko, phir server se maango
  const { sites, tooBig, isFetching, isError, refetch } = useBboxSites(debouncedView?.bbox);
  const { zones } = useNobinZones(debouncedView?.bbox);

  const pickSite = (s) => {
    setSelectedZone(null);
    setSelected(s);
  };
  const pickZone = (z) => {
    setSelected(null);
    setSelectedZone(z);
  };
  const clearAll = () => {
    setSelected(null);
    setSelectedZone(null);
  };

  return (
    <div className="absolute inset-0">
      <MapView
        sites={sites}
        zones={zones}
        selectedId={selected?.id}
        onViewChange={setView}
        onSiteClick={pickSite}
        onZoneClick={pickZone}
        onMapClick={clearAll}
      />

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

      {/* Neeche: card khula ho to wo, warna legend + "no dustbin" button */}
      {selected ? (
        <SitePinCard site={selected} onClose={() => setSelected(null)} />
      ) : selectedZone ? (
        <NobinZoneCard zone={selectedZone} onClose={() => setSelectedZone(null)} />
      ) : (
        <>
          <div className="pointer-events-none absolute bottom-6 left-3 z-10">
            <MapLegend />
          </div>
          <Link
            to="/nobin"
            className="absolute right-3 bottom-6 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-violet-700"
          >
            <Ban className="h-4 w-4" />
            {t('nobin.mapButton')}
          </Link>
        </>
      )}
    </div>
  );
}