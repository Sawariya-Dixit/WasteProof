import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Flag, X } from 'lucide-react';
import { thumbUrl } from '@/lib/image';
import { useAuth } from '@/hooks/useAuth';
import { siteKey } from '@/hooks/useSite';
import { reportPhoto } from '@/api/sites';

const REASONS = ['face_visible', 'plate_visible', 'not_waste', 'inappropriate', 'other'];

// Site ki blurred photos ki patti + full-screen viewer (pinch zoom, swipe buttons, photo report)
export default function PhotoStrip({ photos = [], siteId }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { isAuthed } = useAuth();
  const [open, setOpen] = useState(null); // index ya null
  const [menu, setMenu] = useState(false); // report reasons dikha rahe hain?

  const close = useCallback(() => {
    setOpen(null);
    setMenu(false);
  }, []);
  const step = useCallback(
    (d) => {
      setMenu(false);
      setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length));
    },
    [photos.length],
  );

  const flag = useMutation({
    mutationFn: (reason) => reportPhoto(siteId, { photoUrl: photos[open], reason }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: siteKey(siteId) });
      qc.invalidateQueries({ queryKey: ['sites'] });
      if (data.removed) close();
    },
  });

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

  // Photo hatne ke baad index bahar na rahe
  useEffect(() => {
    if (open !== null && open >= photos.length) setOpen(photos.length ? photos.length - 1 : null);
  }, [photos.length, open]);

  if (!photos.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t('site.noPhotos')}</p>;
  }

  const flagMsg = flag.isSuccess
    ? t('site.reportPhoto.done')
    : flag.isError
      ? flag.error?.code === 'ALREADY_FLAGGED'
        ? t('site.reportPhoto.already')
        : t('errors.generic')
      : null;

  return (
    <>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label={t('site.photos')}>
        {photos.map((url, i) => (
          <li key={url} className="shrink-0">
            <button
              onClick={() => {
                flag.reset();
                setOpen(i);
              }}
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

      {open !== null && photos[open] && (
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
            style={{ touchAction: 'pinch-zoom' }} // phone par pinch se zoom
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
            </>
          )}

          <div
            className="absolute bottom-4 flex max-w-full flex-col items-center gap-2 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {photos.length > 1 && (
              <p className="text-sm text-white/80">
                {open + 1} / {photos.length}
              </p>
            )}
            {isAuthed && !menu && !flagMsg && (
              <button
                onClick={() => setMenu(true)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm text-white hover:bg-white/25"
              >
                <Flag className="h-4 w-4" />
                {t('site.reportPhoto.button')}
              </button>
            )}
            {menu && !flagMsg && (
              <div className="w-full max-w-sm space-y-1 rounded-xl bg-white p-3 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                <p className="font-medium">{t('site.reportPhoto.title')}</p>
                {REASONS.map((r) => (
                  <button
                    key={r}
                    disabled={flag.isPending}
                    onClick={() => flag.mutate(r)}
                    className="block min-h-11 w-full rounded-lg px-2 text-left hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-slate-800"
                  >
                    {t(`site.reportPhoto.reasons.${r}`)}
                  </button>
                ))}
                <button onClick={() => setMenu(false)} className="min-h-11 w-full text-slate-500">
                  {t('site.reportPhoto.cancel')}
                </button>
              </div>
            )}
            {flagMsg && (
              <p className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white" role="status">
                {flagMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}