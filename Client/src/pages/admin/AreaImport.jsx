import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { importAreas } from '@/api/admin';
import { adminErrorText } from './adminErrors';

const MAX_MB = 20;

export default function AreaImport() {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [level, setLevel] = useState('assembly');
  const [pilot, setPilot] = useState('22.5933,76.9132'); // lat,lng (Khategaon)
  const [localError, setLocalError] = useState('');

  const run = useMutation({ mutationFn: importAreas });

  async function submit(dryRun) {
    setLocalError('');
    const file = fileRef.current?.files?.[0];
    if (!file) return setLocalError(t('admin.areas.pickFile'));
    if (file.size > MAX_MB * 1024 * 1024) return setLocalError(t('admin.areas.tooBig', { mb: MAX_MB }));

    let geojson;
    try {
      geojson = JSON.parse(await file.text());
    } catch {
      return setLocalError(t('admin.areas.badJson'));
    }
    const body = { level, geojson, dryRun };
    const [lat, lng] = pilot.split(',').map((x) => Number(x.trim()));
    if (pilot.trim() && Number.isFinite(lat) && Number.isFinite(lng)) body.pilotPoint = { lat, lng };
    run.mutate(body);
  }

  const res = run.data;
  return (
    <section className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.areas.help')}</p>

      <label className="block text-sm font-medium">
        {t('admin.areas.level')}
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900">
          {['assembly', 'loksabha', 'district'].map((l) => (
            <option key={l} value={l}>{t(`areas.level.${l}`, { defaultValue: l })}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        {t('admin.areas.file')}
        <input ref={fileRef} type="file" accept=".geojson,.json,application/geo+json,application/json" className="mt-1 block w-full text-sm" />
      </label>

      <label className="block text-sm font-medium">
        {t('admin.areas.pilot')}
        <input value={pilot} onChange={(e) => setPilot(e.target.value)} placeholder="22.5933,76.9132" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900" />
      </label>

      <div className="flex gap-2">
        <Button variant="outline" loading={run.isPending && run.variables?.dryRun} disabled={run.isPending} onClick={() => submit(true)}>{t('admin.checkOnly')}</Button>
        <Button loading={run.isPending && !run.variables?.dryRun} disabled={run.isPending} onClick={() => submit(false)}>{t('admin.import')}</Button>
      </div>

      {localError && <Alert>{localError}</Alert>}
      {run.isError && <Alert>{adminErrorText(run.error, t)}</Alert>}

      {res && (
        <div className="space-y-1 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800" role="status">
          <p className="font-semibold">{res.dryRun ? t('admin.areas.dryDone') : t('admin.areas.importDone')}</p>
          <p>{t('admin.areas.summary', { total: res.total, valid: res.valid, invalid: res.invalidCount })}</p>
          {!res.dryRun && <p>{t('admin.areas.saved', { saved: res.saved, failed: res.failed.length, pilot: res.pilotMarked })}</p>}
          {res.duplicateCodes > 0 && <p className="text-amber-700 dark:text-amber-300">{t('admin.areas.dupes', { n: res.duplicateCodes })}</p>}
          {[...res.invalid, ...res.failed].slice(0, 10).map((m) => (
            <p key={m} className="text-red-700 dark:text-red-300">• {m}</p>
          ))}
        </div>
      )}
    </section>
  );
}