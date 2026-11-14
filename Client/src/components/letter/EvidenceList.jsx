import { useTranslation } from 'react-i18next';
import { VERIFY_THRESHOLD } from '@/lib/mapConfig';

export default function EvidenceList({ evidence, scope }) {
  const { t, i18n } = useTranslation();
  const counts = evidence?.counts ?? {};
  const dates = evidence?.dates ?? {};
  const photos = evidence?.photos ?? [];
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(i18n.language) : null);

  const rows =
    scope === 'site'
      ? [
          [t('letter.ev.reports'), counts.reports],
          [
            t('letter.ev.backers'),
            t('letter.ev.backersOf', {
              count: Math.min(counts.backers ?? 0, VERIFY_THRESHOLD),
              total: VERIFY_THRESHOLD,
            }),
          ],
        ]
      : [
          [t('letter.ev.verified'), counts.verified],
          [t('letter.ev.total'), counts.total],
        ];
  rows.push([t('letter.ev.first'), fmt(dates.first)]);
  if (scope !== 'site') rows.push([t('letter.ev.latest'), fmt(dates.last)]);
  rows.push([t('letter.ev.location'), evidence?.location?.text]);

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-base font-semibold">{t('letter.evidenceTitle')}</h2>
      <dl className="space-y-1 text-sm">
        {rows
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
      </dl>

      {photos.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">{t('letter.ev.photos')}</p>
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <li key={url}>
                <img
                  src={url}
                  alt={t('letter.ev.photoAlt', { n: i + 1 })}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}