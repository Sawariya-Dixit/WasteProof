import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MapPin, X } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { usePlaces } from '@/hooks/usePlaces';

// "Places" pill: is map box me reports kahan-kahan hain (assembly area wise), counts ke saath.
// Row par tap = us area ka page.
export default function PlacesPill({ bbox }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { places, isLoading, isError, refetch } = usePlaces(bbox, { enabled: open });

  return (
    <div className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-sm font-medium shadow dark:bg-slate-900/90"
      >
        {open ? <X className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
        {t('map.places')}
      </button>

      {open && (
        <section
          className="absolute top-11 left-0 z-30 max-h-72 w-72 overflow-y-auto rounded-xl bg-white p-3 shadow-lg dark:bg-slate-900"
          aria-label={t('map.placesTitle')}
        >
          <h2 className="mb-2 text-sm font-semibold">{t('map.placesTitle')}</h2>

          {isLoading && (
            <div className="flex justify-center py-4">
              <Spinner className="h-5 w-5" />
            </div>
          )}
          {isError && (
            <p className="text-sm text-red-700 dark:text-red-300" role="alert">
              {t('map.loadError')}{' '}
              <button onClick={() => refetch()} className="font-semibold underline">
                {t('map.retry')}
              </button>
            </p>
          )}
          {!isLoading && !isError && places.length === 0 && (
            <p className="py-2 text-sm text-slate-500 dark:text-slate-400">{t('map.placesEmpty')}</p>
          )}

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {places.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/area/${p.id}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 flex-col justify-center py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('map.placeCounts', { total: p.totalCount, verified: p.verifiedCount })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}