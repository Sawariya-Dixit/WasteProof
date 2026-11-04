import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Check } from 'lucide-react';

// Phone par native share sheet, na ho to link copy
export default function ShareButton({ title, text }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user ne cancel kiya
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t('site.share'), url); // clipboard blocked ho to link dikhao
    }
  };

  return (
    <button
      onClick={share}
      className="inline-flex min-h-11 items-center gap-1.5 text-sm text-green-700 underline dark:text-green-400"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? t('site.shareCopied') : t('site.share')}
    </button>
  );
}