import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { createRep, deleteRep, fetchReps, importRepsCsv, searchAreas } from '@/api/admin';
import { adminErrorText } from './adminErrors';

const OFFICES = ['mla', 'mp', 'collector', 'councillor', 'commissioner'];
const LEVEL_FOR = { mla: 'assembly', mp: 'loksabha', collector: 'district', councillor: 'ward', commissioner: 'ward' };
const TEMPLATE = 'office,areaLevel,areaName,name,contactNote\nmla,assembly,Khategaon,,\n';

function AddForm() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [office, setOffice] = useState('mla');
  const [search, setSearch] = useState('');
  const [areaId, setAreaId] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const areas = useQuery({
    queryKey: ['admin', 'areas', LEVEL_FOR[office], search],
    queryFn: () => searchAreas({ level: LEVEL_FOR[office], q: search || undefined, limit: 20 }),
  });
  const add = useMutation({
    mutationFn: createRep,
    onSuccess: () => {
      setName('');
      setNote('');
      qc.invalidateQueries({ queryKey: ['admin', 'reps'] });
    },
  });
  const ready = areaId && name.trim().length >= 2;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <h3 className="font-semibold">{t('admin.reps.add')}</h3>
      <label className="block text-sm font-medium">
        {t('admin.reps.office')}
        <select value={office} onChange={(e) => { setOffice(e.target.value); setAreaId(''); }} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900">
          {OFFICES.map((o) => <option key={o} value={o}>{t(`admin.reps.offices.${o}`)}</option>)}
        </select>
      </label>
      <FormField label={t('admin.reps.searchArea')} value={search} onChange={(e) => setSearch(e.target.value)} />
      <label className="block text-sm font-medium">
        {t('admin.reps.area')}
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900">
          <option value="">—</option>
          {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}{a.isPilot ? ' ★' : ''} ({a.state})</option>)}
        </select>
      </label>
      <FormField label={t('admin.reps.name')} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      <FormField label={t('admin.reps.note')} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.reps.noParty')}</p>
      <Button disabled={!ready} loading={add.isPending} onClick={() => add.mutate({ office, areaId, name: name.trim(), ...(note.trim() ? { contactNote: note.trim() } : {}) })}>
        {t('admin.reps.save')}
      </Button>
      {add.isError && <Alert>{adminErrorText(add.error, t)}</Alert>}
      {add.isSuccess && <Alert type="success">{t('admin.reps.saved')}</Alert>}
    </div>
  );
}

function CsvImport() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [csv, setCsv] = useState(TEMPLATE);
  const run = useMutation({
    mutationFn: importRepsCsv,
    onSuccess: (r) => !r.dryRun && qc.invalidateQueries({ queryKey: ['admin', 'reps'] }),
  });
  const res = run.data;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <h3 className="font-semibold">{t('admin.reps.csvTitle')}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.reps.csvHelp')}</p>
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} spellCheck={false} aria-label="CSV" className="w-full rounded-lg border border-slate-300 bg-transparent p-2 font-mono text-xs dark:border-slate-700" />
      <div className="flex gap-2">
        <Button variant="outline" disabled={run.isPending} onClick={() => run.mutate({ csv, dryRun: true })}>{t('admin.checkOnly')}</Button>
        <Button disabled={run.isPending} onClick={() => run.mutate({ csv })}>{t('admin.import')}</Button>
      </div>
      {run.isError && <Alert>{adminErrorText(run.error, t)}</Alert>}
      {res && (
        <div className="space-y-1 text-sm" role="status">
          <p className="font-semibold">{t(res.dryRun ? 'admin.reps.dryResult' : 'admin.reps.result', { saved: res.saved, rows: res.rows })}</p>
          {res.skipped.map((s) => <p key={s.line} className="text-red-700 dark:text-red-300">• {t('admin.reps.line', { line: s.line })}: {s.reason}</p>)}
        </div>
      )}
    </div>
  );
}

export default function RepsManager() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'reps'], queryFn: () => fetchReps({ limit: 100 }) });
  const del = useMutation({ mutationFn: deleteRep, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reps'] }) });

  return (
    <section className="space-y-4">
      <AddForm />
      <CsvImport />
      <h3 className="font-semibold">{t('admin.reps.list')}</h3>
      {q.isError && <Alert>{adminErrorText(q.error, t)}</Alert>}
      {del.isError && <Alert>{adminErrorText(del.error, t)}</Alert>}
      <ul className="space-y-2">
        {(q.data?.reps ?? []).map((r) => (
          <li key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-800">
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-medium">{r.name}</div>
              <div className="text-slate-500 dark:text-slate-400">{t(`admin.reps.offices.${r.office}`)} · {r.area?.name ?? '—'}</div>
            </div>
            <Button
              variant="ghost"
              aria-label={t('admin.reps.delete')}
              disabled={del.isPending}
              onClick={() => window.confirm(t('admin.reps.confirmDelete', { name: r.name })) && del.mutate(r.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
        {q.data && q.data.reps.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.reps.empty')}</p>}
      </ul>
    </section>
  );
}