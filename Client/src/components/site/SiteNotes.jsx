import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useAddNote, useDeleteNote, useNotes } from '@/hooks/useNotes';

const MAX_CHARS = 500; // server ke NOTES.maxChars jaisa
const MIN_CHARS = 3;
const PAGE = 20;

function AiSummary({ summary, lang }) {
  const { t } = useTranslation();
  if (!summary) return null;
  const text = lang === 'hi' ? summary.hi : summary.en;
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-violet-950/40">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-800 dark:text-violet-300">
        <Sparkles className="h-4 w-4" />
        {t('notes.aiLabel', { count: summary.noteCount })}
      </p>
      <p className="mt-1.5 text-sm text-slate-800 dark:text-slate-100">{text}</p>
      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{t('notes.aiDisclaimer')}</p>
    </div>
  );
}

function NoteForm({ siteId }) {
  const { t } = useTranslation();
  const add = useAddNote(siteId);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const trimmed = text.trim();
  const canSend = trimmed.length >= MIN_CHARS && trimmed.length <= MAX_CHARS && !add.isPending;

  const submit = (e) => {
    e.preventDefault();
    if (!canSend) return;
    setSent(false);
    add.mutate(trimmed, {
      onSuccess: () => {
        setText('');
        setSent(true);
      },
    });
  };

  const errorText = (err) => {
    switch (err?.code) {
      case 'PII_DETECTED':
      case 'NOTE_LIMIT':
      case 'HTTP_429':
      case 'NETWORK_ERROR':
        return t(`notes.err.${err.code}`);
      default:
        return t('errors.generic');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block text-sm font-medium" htmlFor="note-text">
        {t('notes.formLabel')}
      </label>
      <textarea
        id="note-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_CHARS}
        rows={3}
        disabled={add.isPending}
        placeholder={t('notes.placeholder')}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {text.length}/{MAX_CHARS}
        </span>
        <Button type="submit" loading={add.isPending} disabled={!canSend}>
          {t('notes.add')}
        </Button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('notes.privacy')}</p>
      {add.isError && <Alert>{errorText(add.error)}</Alert>}
      {sent && !add.isError && (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {t('notes.added')}
        </p>
      )}
    </form>
  );
}

// Site page par: AI summary + residents ke notes + naya note
export default function SiteNotes({ siteId }) {
  const { t, i18n } = useTranslation();
  const { isAuthed } = useAuth();
  const [limit, setLimit] = useState(PAGE);
  const { data, isLoading, isError, refetch } = useNotes(siteId, limit);
  const del = useDeleteNote(siteId);
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const onDelete = (id) => {
    if (window.confirm(t('notes.confirmDelete'))) del.mutate(id);
  };

  return (
    <section className="space-y-3" aria-label={t('notes.title')}>
      <h2 className="text-base font-semibold">{t('notes.title')}</h2>

      {isLoading && (
        <div className="flex justify-center py-4" role="status" aria-label={t('common.loading')}>
          <Spinner className="h-6 w-6 text-green-600" />
        </div>
      )}

      {isError && (
        <Alert>
          {t('notes.loadError')}{' '}
          <button onClick={() => refetch()} className="font-semibold underline">
            {t('map.retry')}
          </button>
        </Alert>
      )}

      {data && (
        <>
          <AiSummary summary={data.summary} lang={lang} />

          {data.notes.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('notes.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {data.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800"
                >
                  <p className="break-words whitespace-pre-wrap">{n.text}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {new Date(n.createdAt).toLocaleDateString(i18n.language)}
                      {n.flagged && ` · ${t('notes.flagged')}`}
                    </span>
                    {n.mine && (
                      <button
                        onClick={() => onDelete(n.id)}
                        disabled={del.isPending}
                        className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('notes.delete')}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data.total > data.notes.length && limit < 100 && (
            <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
              {t('notes.showMore', { shown: data.notes.length, total: data.total })}
            </Button>
          )}
        </>
      )}

      {del.isError && <Alert>{t('errors.generic')}</Alert>}

      {isAuthed ? (
        <NoteForm siteId={siteId} />
      ) : (
        <Link to="/login" className="inline-block font-medium text-green-700 underline dark:text-green-400">
          {t('notes.login')}
        </Link>
      )}
    </section>
  );
}