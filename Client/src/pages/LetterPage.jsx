import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LetterPreview from '@/components/letter/LetterPreview';
import LetterActions from '@/components/letter/LetterActions';
import EvidenceList from '@/components/letter/EvidenceList';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { useCreateLetter, useLetter, useLetterPdf } from '@/hooks/useLetters';

const LANGS = [
  ['en', 'English'],
  ['hi', 'हिन्दी'],
];

export default function LetterPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: letter, isLoading, isError, error, refetch } = useLetter(id);
  const pdf = useLetterPdf(id, Boolean(letter)); // letter aate hi PDF bhi taiyaar hone lagta hai
  const create = useCreateLetter();

  const backTo = letter?.siteId ? `/site/${letter.siteId}` : letter?.areaId ? `/area/${letter.areaId}` : '/';
  const back = (
    <Link
      to={backTo}
      className="inline-flex min-h-11 items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white print:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('common.back')}
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
          {missing ? t('letter.notFound') : t('letter.loadError')}{' '}
          {!missing && (
            <button onClick={() => refetch()} className="font-semibold underline">
              {t('map.retry')}
            </button>
          )}
        </Alert>
      </div>
    );
  }

  // Doosri bhasha = naya letter (server wahi facts se dobara banata hai), phir us par chale jao
  const switchLang = (lang) =>
    create.mutate(
      {
        scope: letter.scope,
        siteId: letter.siteId ?? undefined,
        areaId: letter.areaId ?? undefined,
        issueType: letter.scope === 'site' ? undefined : letter.issueType,
        lang,
      },
      { onSuccess: (data) => navigate(`/letter/${data.letter.id}`, { replace: true }) },
    );

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4 print:max-w-none print:space-y-0 print:p-0">
      {back}

      <header className="space-y-1 print:hidden">
        <h1 className="text-xl font-semibold">{t('letter.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('letter.draftNote')}</p>
      </header>

      <div
        className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 print:hidden"
        role="group"
        aria-label={t('letter.langLabel')}
      >
        {LANGS.map(([code, label]) => (
          <button
            key={code}
            type="button"
            aria-pressed={letter.lang === code}
            disabled={create.isPending}
            onClick={() => letter.lang !== code && switchLang(code)}
            className={`min-h-11 flex-1 rounded-lg px-2 text-sm font-medium disabled:opacity-60 ${
              letter.lang === code
                ? 'bg-white shadow dark:bg-slate-900'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {create.isPending && (
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300" role="status">
          <Spinner className="h-4 w-4" /> {t('letter.panel.working')}
        </p>
      )}
      {create.isError && <Alert>{t('errors.generic')}</Alert>}

      <LetterPreview letter={letter} />

      {letter.usedTemplate && (
        <p className="text-xs text-slate-500 dark:text-slate-400 print:hidden">
          {t('letter.templateNote')}
        </p>
      )}

      <LetterActions letter={letter} pdf={pdf} />

      <div className="print:hidden">
        <EvidenceList evidence={letter.evidence} scope={letter.scope} />
      </div>
    </div>
  );
}