import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import StatusChip from '@/components/site/StatusChip';
import BackersMeter from '@/components/site/BackersMeter';
import PhotoStrip from '@/components/site/PhotoStrip';
import SeatsCard from '@/components/site/SeatsCard';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { useSite } from '@/hooks/useSite';
import { VERIFY_THRESHOLD } from '@/lib/mapConfig';
import VoteButtons from '@/components/site/VoteButtons';
import ShareButton from '@/components/site/ShareButton';
export default function SitePage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { data: site, isLoading, isError, error, refetch } = useSite(id);

  const back = (
    <Link
      to="/"
      className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('site.backToMap')}
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
          {missing ? t('site.notFound') : t('site.loadError')}{' '}
          {!missing && (
            <button onClick={() => refetch()} className="font-semibold underline">
              {t('map.retry')}
            </button>
          )}
        </Alert>
      </div>
    );
  }

  const { lat, lng } = site.location;
  const typeLabel = t(`map.types.${site.type}`, { defaultValue: site.type });

  return (
    <div className="mx-auto w-full max-w-md space-y-5 p-4">
      {back}

      <header className="space-y-2">
        <h1 className="text-xl font-semibold">{typeLabel}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={site.status} />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('map.reportsCount', { count: site.reportCount })}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('site.firstReported', {
              date: new Date(site.createdAt).toLocaleDateString(i18n.language),
            })}
          </span>
        </div>
      </header>

      <PhotoStrip photos={site.photoUrls} siteId={site.id} />

      <section className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <BackersMeter count={site.backerCount} />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {site.status === 'unverified' &&
            t('site.verifyProgress', {
              count: Math.min(site.backerCount, VERIFY_THRESHOLD),
              total: VERIFY_THRESHOLD,
            })}
          {site.status === 'verified' && t('site.verifiedText', { total: VERIFY_THRESHOLD })}
          {site.status === 'cleaned' && t('site.cleanedText')}
        </p>
      </section>
      <VoteButtons site={site} />
      <SeatsCard seats={site.seats} localBody={site.localBody} />

            <div className="flex flex-wrap gap-x-6">
        <ShareButton title={typeLabel} text={t('site.shareText')} />
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-green-700 underline dark:text-green-400"
        >
          <ExternalLink className="h-4 w-4" />
          {t('site.openInMaps')}
        </a>
      </div>
    </div>
  );
}