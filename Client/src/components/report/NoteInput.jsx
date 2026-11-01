import { useTranslation } from 'react-i18next';
import { NOTE_MAX_CHARS } from '@/lib/snapConfig';

export default function NoteInput({ value, onChange, disabled }) {
  const { t } = useTranslation();
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{t('snap.note')}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, NOTE_MAX_CHARS))}
        maxLength={NOTE_MAX_CHARS}
        rows={2}
        disabled={disabled}
        placeholder={t('snap.notePlaceholder')}
        className="w-full rounded-lg border border-slate-300 bg-transparent p-2.5 dark:border-slate-700"
      />
      <span className="mt-1 block text-right text-xs text-slate-500">
        {value.length}/{NOTE_MAX_CHARS}
      </span>
    </label>
  );
}