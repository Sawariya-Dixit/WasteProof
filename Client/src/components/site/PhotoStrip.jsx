import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { thumbUrl } from '@/lib/image';

export default function PhotoStrip({ photos = [] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, step]);

  if (!photos.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t('site.noPhotos')}</p>;
  }

  return (
    <>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label={t('site.photos')}>
        {photos.map((url, i) => (
          <li key={url} className="shrink-0">
            <button
              onClick={() => setOpen(i)}
              aria-label={t('site.openPhoto', { n: i + 1, total: photos.length })}
              className="block h-28 w-28 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800"
            >
              <img
                src={thumbUrl(url, 240)}
                onError={(e) => {
                  if (e.currentTarget.src !== url) e.currentTarget.src = url;
                }}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('site.photos')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          <img
            src={photos[open]}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={close}
            aria-label={t('map.close')}
            className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label={t('site.prev')}
                className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label={t('site.next')}
                className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <p className="absolute bottom-4 text-sm text-white/80">
                {open + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}