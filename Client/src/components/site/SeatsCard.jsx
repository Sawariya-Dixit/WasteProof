import { useTranslation } from 'react-i18next';

const ROWS = [
  { level: 'ward', office: 'councillor' },
  { level: 'assembly', office: 'mla' },
  { level: 'loksabha', office: 'mp' },
  { level: 'district', office: 'collector' },
];

export default function SeatsCard({ seats, localBody }) {
  const { t } = useTranslation();
  const rows = ROWS.map((r) => ({ ...r, seat: seats?.[r.level] })).filter((r) => r.seat);

  return (
    <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-base font-semibold">{t('site.seatsTitle')}</h2>

      {rows.length === 0 && !localBody ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('site.seatsNone')}</p>
      ) : (
        <dl className="mt-3 space-y-3 text-sm">
          {localBody && (
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('site.localBody')}</dt>
              <dd className="font-medium">{localBody.name}</dd>
              <dd className="text-slate-600 dark:text-slate-300">{localBody.headTitle}</dd>
            </div>
          )}
          {rows.map(({ level, office, seat }) => {
            const rep = seat.representatives?.find((r) => r.office === office);
            return (
              <div key={level}>
                <dt className="text-xs text-slate-500 dark:text-slate-400">{t(`site.level.${level}`)}</dt>
                <dd className="font-medium">{seat.name}</dd>
                {rep && (
                  <dd className="text-slate-600 dark:text-slate-300">
                    {t(`site.office.${office}`)}: {rep.name}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}