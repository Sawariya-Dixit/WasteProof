import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { siteKey } from '@/hooks/useSite';
import { voteOnSite, meTooSite } from '@/api/sites';
import { getPositionOnce } from '@/lib/geo';

const GEO_ERRORS = ['denied', 'unavailable', 'timeout', 'unsupported'];

export default function VoteButtons({ site }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthed } = useAuth();

  const mutation = useMutation({
    mutationFn: async (kind) => {
      // Tap karte hi location permission poochhi jati hai (page khulte hi nahi)
      const pos = await getPositionOnce();
      return kind === 'me_too'
        ? meTooSite(site.id, pos)
        : voteOnSite(site.id, { value: kind, ...pos });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: siteKey(site.id) });
      qc.invalidateQueries({ queryKey: ['sites'] }); // map ke pin ka x of 10 bhi badle
      if (data.site.status === 'hidden') navigate('/'); // 'no' votes se site hide ho gayi
    },
  });

  const errorText = (err) => {
    if (GEO_ERRORS.includes(err?.message)) return t(`vote.err.${err.message}`);
    switch (err?.code) {
      case 'TOO_FAR':
        return t('vote.err.TOO_FAR', { m: err.details?.maxM ?? 300, d: err.details?.distanceM ?? '?' });
      case 'GPS_TOO_WEAK':
        return t('vote.err.GPS_TOO_WEAK', { m: err.details?.maxM ?? 100 });
      case 'ALREADY_VOTED':
      case 'SITE_CLOSED':
      case 'NETWORK_ERROR':
        return t(`vote.err.${err.code}`);
      default:
        return t('errors.generic');
    }
  };

  const busy = mutation.isPending;
  const addPhoto = (
    <div className="space-y-1">
      <Link
        to={`/snap?type=${site.type}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Camera className="h-4 w-4" />
        {t('vote.addPhoto')}
      </Link>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('vote.addPhotoHint')}</p>
    </div>
  );

  // Cleaned site par vote band (cleanup claim Day 13)
  if (site.status === 'cleaned') return null;

  if (!isAuthed) {
    return (
      <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <Link to="/login" className="font-medium text-green-700 underline dark:text-green-400">
          {t('vote.loginToVote')}
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      {site.myVote ? (
        <p className="text-sm font-medium" role="status">
          {t(`vote.done.${site.myVote}`)}
        </p>
      ) : (
        <>
          <div>
            <h2 className="text-base font-semibold">{t('vote.title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('vote.hint')}</p>
          </div>
          {mutation.isError && <Alert>{errorText(mutation.error)}</Alert>}
          {busy && (
            <p className="text-xs text-slate-500 dark:text-slate-400" role="status">
              {t('vote.locating')}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Button loading={busy && mutation.variables === 'yes'} disabled={busy} onClick={() => mutation.mutate('yes')}>
              {t('vote.yes')}
            </Button>
            <Button
              variant="outline"
              loading={busy && mutation.variables === 'me_too'}
              disabled={busy}
              onClick={() => mutation.mutate('me_too')}
            >
              {t('vote.meToo')}
            </Button>
            <Button
              variant="outline"
              loading={busy && mutation.variables === 'no'}
              disabled={busy}
              onClick={() => mutation.mutate('no')}
            >
              {t('vote.no')}
            </Button>
          </div>
        </>
      )}
      {addPhoto}
    </section>
  );
}