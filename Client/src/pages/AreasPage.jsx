import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AreasMap from '@/components/areas/AreasMap';
import AreaRankList from '@/components/areas/AreaRankList';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { useAreaRanking, useAreasMap } from '@/hooks/useAreas';
import { EMPTY_FC, SCORE_COLORS } from '@/lib/areaGeo';

const LEVELS = ['assembly', 'loksabha', 'district'];

const LEGEND = [
  { key: 'good', color: SCORE_COLORS.good },
  { key: 'mid', color: SCORE_COLORS.mid },
  { key: 'bad', color: SCORE_COLORS.bad },
  { key: 'none', color: SCORE_COLORS.none },
];

export default function AreasPage() {
  const { t } = useTranslation();
  const [level, setLevel] = useState('assembly');
  const [selectedId, setSelectedId] = useState(null);

  const map = useAreasMap(level);
  const ranking = useAreaRanking(level);

  const changeLevel = (l) => {
    setLevel(l);
    setSelectedId(null);
  };

  return (
    <div>
      <div className="relative h-[45vh] min-h-64">
        <AreasMap geojson={map.data ?? EMPTY_FC} selectedId={selectedId} onSelect={setSelectedId} />
        {map.isFetching && (
          <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm shadow dark:bg-slate-900/90">
            <Spinner className="h-4 w-4" /> {t('map.loading')}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-md space-y-4 p-4">
        <div>
          <h1 className="text-xl font-semibold">{t('areas.title')}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('areas.intro')}</p>
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
          {LEVELS.map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={level === l}
              onClick={() => changeLevel(l)}
              className={`min-h-11 flex-1 rounded-lg px-2 text-sm font-medium ${
                level === l ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t(`areas.level.${l}`)}
            </button>
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
          {LEGEND.map(({ key, color }) => (
            <li key={key} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              {t(`areas.legend.${key}`)}
            </li>
          ))}
        </ul>

        {map.isError && (
          <Alert>
            {t('areas.mapError')}{' '}
            <button onClick={() => map.refetch()} className="font-semibold underline">
              {t('map.retry')}
            </button>
          </Alert>
        )}

        {ranking.isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {ranking.isError && (
          <Alert>
            {t('areas.rankingError')}{' '}
            <button onClick={() => ranking.refetch()} className="font-semibold underline">
              {t('map.retry')}
            </button>
          </Alert>
        )}

        {ranking.data?.length === 0 && (
          <p className="py-8 text-center text-slate-600 dark:text-slate-300">{t('areas.empty')}</p>
        )}

        {ranking.data?.length > 0 && (
          <AreaRankList areas={ranking.data} selectedId={selectedId} onSelect={setSelectedId} />
        )}
      </div>
    </div>
  );
}