// Backend ke error code -> i18n key, taaki Hindi me bhi sahi message dikhe
export function adminErrorText(err, t) {
  return t(`errors.codes.${err?.code}`, { defaultValue: t('errors.generic') });
}