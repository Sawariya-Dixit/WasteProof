import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './styles/index.css';
import i18n from './i18n';
import './auth/cognito'; // Amplify yahin configure hota hai
import App from './App.jsx';
import { useUiStore, applyTheme } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { setUnauthorizedHandler } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

// Theme: shuru me lagao, badalne par aur system change par dobara lagao
applyTheme(useUiStore.getState().theme);
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => applyTheme(useUiStore.getState().theme));

// Store badalte hi theme aur language lagu
useUiStore.subscribe((s) => {
  applyTheme(s.theme);
  if (i18n.language !== s.language) i18n.changeLanguage(s.language);
});

// Backend 401 de to logout (token kharab ya expire)
setUnauthorizedHandler(() => useAuthStore.getState().logout());

// App start: session check
useAuthStore.getState().init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
