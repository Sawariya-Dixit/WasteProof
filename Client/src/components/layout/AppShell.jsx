import { Outlet } from 'react-router';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useOnlineQueue } from '@/hooks/useOnlineQueue';

export default function AppShell() {
  useOnlineQueue(); // offline me rakhi reports online aate hi bhejta hai
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}