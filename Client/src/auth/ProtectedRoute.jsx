import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';

// Login chahiye. role="admin" do to sirf admin.
export default function ProtectedRoute({ role }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Login/Register jaise pages: login ho chuka hai to home bhej do
export function GuestRoute() {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authed') return <Navigate to="/" replace />;
  return <Outlet />;
}
