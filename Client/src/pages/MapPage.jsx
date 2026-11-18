import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Ban, Camera, List, Map as MapIcon } from 'lucide-react';
import MapView from '@/components/map/MapView';
import MapLegend from '@/components/map/MapLegend';
import MapFilters from '@/components/map/MapFilters';
import PlacesPill from '@/components/map/PlacesPill';
import SiteList from '@/components/map/SiteList';
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
  const [filters, setFilters] = useState({ type: '', status: '' }); // '' = sab
  const [listMode, setListMode] = useState(false); // false = map, true = list
  const debouncedView = useDebouncedValue(view, 400); // 400 ms ruko, phir server se maango

  // '' ko hatao, taaki server ko khaali type/status na jaye
  const activeFilters = useMemo(
    () => ({
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }),
    [filters],
  );

  const { sites, tooBig, isFetching, isError, refetch } = useBboxSites(
    debouncedView?.bbox,
    activeFilters,
  );
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
      {/* Map hamesha mounted rehta hai, taaki list se wapas aane par view (zoom/position) na khoye */}
      <MapView
        sites={sites}
        zones={zones}
        selectedId={selected?.id}
        onViewChange={setView}
        onSiteClick={pickSite}
        onZoneClick={pickZone}
        onMapClick={clearAll}
      />

      {/* List view: map ke upar poori screen */}
      {listMode && (
        <div className="absolute inset-0 z-10 overflow-y-auto bg-slate-50 pt-14 dark:bg-slate-950">
          <SiteList sites={sites} />
        </div>
      )}

      {/* Upar: Places pill, filters, list/map toggle */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-2">
        <PlacesPill bbox={debouncedView?.bbox} />
        <MapFilters value={filters} onChange={setFilters} />
        <button
          onClick={() => setListMode((m) => !m)}
          aria-pressed={listMode}
          className="pointer-events-auto flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-sm font-medium shadow dark:bg-slate-900/90"
        >
          {listMode ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
          {listMode ? t('map.mapView') : t('map.listView')}
        </button>
      </div>

      {/* Status chips (loading / zoom in / count / error) */}
      <div className="pointer-events-none absolute top-14 left-3 z-20 flex flex-col gap-2">
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

      {/* Neeche: card khula ho to wo, warna legend + Add report + no-bin button */}
      {!listMode && selected ? (
        <SitePinCard site={selected} onClose={() => setSelected(null)} />
      ) : !listMode && selectedZone ? (
        <NobinZoneCard zone={selectedZone} onClose={() => setSelectedZone(null)} />
      ) : (
        <>
          {!listMode && (
            <div className="pointer-events-none absolute bottom-6 left-3 z-10">
              <MapLegend />
            </div>
          )}
          <div className="absolute right-3 bottom-6 z-20 flex flex-col items-end gap-2">
            <Link
              to="/nobin"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-violet-700"
            >
              <Ban className="h-4 w-4" />
              {t('nobin.mapButton')}
            </Link>
            <Link
              to="/snap"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-green-700"
            >
              <Camera className="h-4 w-4" />
              {t('map.addReport')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
