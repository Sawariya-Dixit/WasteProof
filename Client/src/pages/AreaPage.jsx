import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import ScoreCard from '@/components/areas/ScoreCard';
import InsightList from '@/components/areas/InsightList';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { useAreaDetail } from '@/hooks/useAreas';
import { scoreColor } from '@/lib/areaGeo';
import DraftLetterPanel from '@/components/letter/DraftLetterPanel';
import { AREA_MIN_VERIFIED, VERIFY_THRESHOLD } from '@/lib/mapConfig';

export default function AreaPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useAreaDetail(id);

  const back = (
    <Link
      to="/areas"
      className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('areas.back')}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label={t('common.loading')}>
        <Spinner className="h-8 w-8 text-green-600" />
      </div>
    );
  }

  if (isError) {
    const missing = error?.status === 404 || error?.code === 'VALIDATION_ERROR';
    return (
      <div className="mx-auto w-full max-w-md space-y-3 p-4">
        {back}
        <Alert>
          {missing ? t('areas.notFound') : t('areas.areaError')}{' '}
          {!missing && (
            <button onClick={() => refetch()} className="font-semibold underline">
              {t('map.retry')}
            </button>
          )}
        </Alert>
      </div>
    );
  }

  const { area, score, topSites, representatives } = data;
  const pct = Math.round((Math.min(score.verifiedCount, AREA_MIN_VERIFIED) / AREA_MIN_VERIFIED) * 100);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 p-4">
      {back}

      <header>
        <h1 className="text-xl font-semibold">{area.name}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t(`areas.level.${area.level}`, { defaultValue: area.level })} · {area.state}
          {area.isPilot ? ` · ${t('areas.pilot')}` : ''}
        </p>
      </header>

      {/* Counts hamesha dikhte hain */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-300">{t('areas.verifiedLabel')}</p>
          <p className="text-2xl font-bold">{score.verifiedCount}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-300">{t('areas.totalLabel')}</p>
          <p className="text-2xl font-bold">{score.totalCount}</p>
        </div>
      </section>

      {score.scoreVisible ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-14 min-w-14 items-center justify-center rounded-full px-2 text-xl font-bold text-white"
              style={{ backgroundColor: scoreColor(score.overallScore) }}
              aria-label={t('areas.overall')}
            >
              {score.overallScore ?? '–'}
            </span>
            <div>
              <p className="font-semibold">{t('areas.overall')}</p>
              {score.diagnosis && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t(`areas.diagnosis.${score.diagnosis}`, { defaultValue: score.diagnosis })}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <ScoreCard label={t('areas.cityScore')} hint={t('areas.cityHint')} value={score.cityScore} />
            <ScoreCard label={t('areas.citizenScore')} hint={t('areas.citizenHint')} value={score.citizenScore} />
            <ScoreCard label={t('areas.binScore')} hint={t('areas.binHint')} value={score.binScore} />
          </div>

          {score.insights?.length > 0 && (
            <div>
              <h2 className="text-base font-semibold">{t('areas.insightsTitle')}</h2>
              <InsightList insights={score.insights} />
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="font-medium">{t('areas.withheld')}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t('areas.needMore', { count: score.needed })}
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={AREA_MIN_VERIFIED}
            aria-valuenow={Math.min(score.verifiedCount, AREA_MIN_VERIFIED)}
          >
            <div className="h-full rounded-full bg-green-600" style={{ width: `${pct}%` }} />
          </div>
        </section>
      )}

            <DraftLetterPanel scope={area.level} areaId={area.id} hidden={!score.scoreVisible} />

      <section>
        <h2 className="text-base font-semibold">{t('areas.topSites')}</h2>
        {topSites.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('areas.noSites')}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {topSites.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/site/${s.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {t(`map.types.${s.type}`, { defaultValue: s.type })}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {t(`map.status.${s.status}`, { defaultValue: s.status })}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium">
                    {t('map.backers', { count: Math.min(s.backerCount, VERIFY_THRESHOLD), total: VERIFY_THRESHOLD })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {representatives.length > 0 && (
        <section>
          <h2 className="text-base font-semibold">{t('areas.repsTitle')}</h2>
          <dl className="mt-2 space-y-1 text-sm">
            {representatives.map((r) => (
              <div key={r.office} className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">
                  {t(`site.office.${r.office}`, { defaultValue: r.office })}
                </dt>
                <dd className="font-medium">{r.name === 'FILL_ME' ? '–' : r.name}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}