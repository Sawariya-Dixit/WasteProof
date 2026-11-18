import { Outlet } from 'react-router';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useOnlineQueue } from '@/hooks/useOnlineQueue';
import NetworkBanner from './NetworkBanner';
import SkipLink from './SkipLink'
import { useHtmlLang } from '@/hooks/useHtmlLang';

export default function AppShell() {
  useHtmlLang();
  useOnlineQueue();
   // offline me rakhi reports online aate hi bhejta hai
  return (
    
        <div className="flex h-dvh flex-col print:block print:h-auto">
          <SkipLink />
      <TopBar />
      <NetworkBanner />
      <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto outline-none print:overflow-visible">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}