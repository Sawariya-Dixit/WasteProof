// Service worker sirf production build me (dev me cache se purana code dikhne ki dikkat hoti hai).
export function registerSW() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}