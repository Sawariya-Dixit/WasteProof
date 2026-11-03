import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { confirmReport } from '@/api/reports';
import { myReportsKey } from '@/hooks/useMyReports';

export default function ConfirmPrompt({ report }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (confirmed) => confirmReport(report.id, confirmed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myReportsKey });
      qc.invalidateQueries({ queryKey: ['reports', 'one', report.id] });
    },
  });

  const typeLabel = t(`map.types.${report.type}`, { defaultValue: report.type });
  const busy = mutation.isPending;

  return (
    <div className="space-y-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
      <p className="text-sm">{t('activity.confirm.question', { type: typeLabel })}</p>
      <p className="text-xs text-slate-600 dark:text-slate-300">{t('activity.confirm.note')}</p>
      {mutation.isError && (
        <Alert>
          {mutation.error?.code === 'NOT_WAITING_CONFIRM'
            ? t('activity.confirm.already')
            : t('errors.generic')}
        </Alert>
      )}
      <div className="flex gap-2">
        <Button loading={busy} onClick={() => mutation.mutate(true)} className="flex-1">
          {t('activity.confirm.yes')}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => mutation.mutate(false)} className="flex-1">
          {t('activity.confirm.no')}
        </Button>
      </div>
    </div>
  );
}