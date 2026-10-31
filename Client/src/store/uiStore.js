import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      theme: 'system', // light | dark | system
      language: 'en', // en | hi
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'junksnap-ui' },
  ),
);

export function applyTheme(theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}
