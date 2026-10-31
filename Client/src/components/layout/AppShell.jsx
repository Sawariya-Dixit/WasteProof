import { Outlet } from 'react-router';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

// Poori screen: upar bar, beech me page, neeche (mobile par) nav.
// h-dvh = mobile browser ki address bar ke saath bhi sahi height.
export default function AppShell() {
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
