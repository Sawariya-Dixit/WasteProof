import i18n from '@/i18n';
import { fetchConfig } from '@/api/config';
import { AREA_MIN_VERIFIED, VERIFY_THRESHOLD, setThresholds } from '@/lib/mapConfig';

// Translation strings me {{siteN}} (site kitne logon se verify) aur {{areaN}} (area me kitni verified sites)
// aate hain. Har t() call me pass na karna pade, isliye i18next ke default variables me rakhe hain.
export function syncI18nNumbers() {
  i18n.options.interpolation = {
    ...i18n.options.interpolation,
    defaultVariables: { siteN: VERIFY_THRESHOLD, areaN: AREA_MIN_VERIFIED },
  };
}

// App start par ek baar. Server na mile / der ho to default numbers (5 aur 10) chalte hain.
export async function loadServerConfig() {
  try {
    setThresholds(await fetchConfig());
  } catch {
    /* defaults */
  }
  syncI18nNumbers();
}