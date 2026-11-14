import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Download, Printer, Share2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { downloadBlob, pdfFileName, printLetter, shareLetter } from '@/lib/letterActions';

// pdf = useLetterPdf() ka result
export default function LetterActions({ letter, pdf }) {
  const { t } = useTranslation();
  const [note, setNote] = useState(null); // 'copied' | 'shareCopied'

  const flash = (key) => {
    setNote(key);
    setTimeout(() => setNote(null), 2500);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(letter.body);
      return true;
    } catch {
      return false; // clipboard na mile to user preview se copy kar le
    }
  };

  const onCopy = async () => {
    if (await copyText()) flash('copied');
  };

  const onShare = async () => {
    const result = await shareLetter(letter, pdf.data);
    if (result === 'unsupported' && (await copyText())) flash('shareCopied');
  };

  const onDownload = () => {
    if (pdf.data) downloadBlob(pdf.data, pdfFileName(letter));
  };

  return (
    <section className="space-y-2 print:hidden" aria-label={t('letter.actions')}>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => printLetter(letter)}>
          <Printer className="h-4 w-4" />
          {t('letter.print')}
        </Button>
        <Button
          variant="outline"
          onClick={onDownload}
          disabled={!pdf.data}
          loading={pdf.isPending && pdf.fetchStatus !== 'idle'}
        >
          <Download className="h-4 w-4" />
          {t('letter.downloadPdf')}
        </Button>
        <Button variant="outline" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          {t('letter.share')}
        </Button>
        <Button variant="outline" onClick={onCopy}>
          {note === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {t('letter.copy')}
        </Button>
      </div>

      <p className="min-h-5 text-xs text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
        {note === 'copied' && t('letter.copied')}
        {note === 'shareCopied' && t('letter.shareCopied')}
        {!note && pdf.isError && t('letter.pdfError')}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('letter.printHint')}</p>
    </section>
  );
}