import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useCreateLetter } from '@/hooks/useLetters';
import { AREA_MIN_VERIFIED } from '@/lib/mapConfig';

const ISSUE_TYPES = [
  'waste_dump',
  'no_bin',
  'overflowing_bin',
  'contaminated_water',
  'open_construction',
];

// Site page (scope="site", siteId) aur Area page (scope=area.level, areaId) dono par lagta hai
export default function DraftLetterPanel({ scope, siteId, areaId, hidden = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const create = useCreateLetter();
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);

  if (hidden) return null;

  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const submit = () =>
    create.mutate(
      {
        scope,
        siteId: scope === 'site' ? siteId : undefined,
        areaId: scope === 'site' ? undefined : areaId,
        issueType: scope === 'site' ? undefined : issueType,
        lang,
      },
      { onSuccess: ({ letter }) => navigate(`/letter/${letter.id}`) },
    );

  const errorText = (err) => {
    switch (err?.code) {
      case 'NOT_ENOUGH_EVIDENCE':
        return t('letter.err.NOT_ENOUGH_EVIDENCE', {
          have: err.details?.verified ?? 0,
          need: err.details?.needed ?? AREA_MIN_VERIFIED,
        });
      case 'SITE_CLEANED':
      case 'NOT_FOUND':
      case 'NETWORK_ERROR':
      case 'HTTP_429':
        return t(`letter.err.${err.code}`);
      default:
        return t('errors.generic');
    }
  };

  if (!isAuthed) {
    return (
      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <Link to="/login" className="font-medium text-green-700 underline dark:text-green-400">
          {t('letter.panel.login')}
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <h2 className="text-base font-semibold">{t('letter.panel.title')}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {scope === 'site'
            ? t('letter.panel.hintSite')
            : t('letter.panel.hintArea', { total: AREA_MIN_VERIFIED })}
        </p>
      </div>

      {scope !== 'site' && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('letter.panel.issue')}</span>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
          >
            {ISSUE_TYPES.map((x) => (
              <option key={x} value={x}>
                {t(`map.types.${x}`, { defaultValue: x })}
              </option>
            ))}
          </select>
        </label>
      )}

      <Button onClick={submit} loading={create.isPending}>
        <FileText className="h-4 w-4" />
        {create.isPending ? t('letter.panel.working') : t('letter.panel.button')}
      </Button>

      {create.isError && <Alert>{errorText(create.error)}</Alert>}
    </section>
  );
}