import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute, { GuestRoute } from '@/auth/ProtectedRoute';
import Spinner from '@/components/ui/Spinner';

// Har page alag chunk: pehli load halki (slow 3G ke liye)
const MapPage = lazy(() => import('@/pages/MapPage'));
const SitePage = lazy(() => import('@/pages/SitePage'));
const AreasPage = lazy(() => import('@/pages/AreasPage'));
const AreaPage = lazy(() => import('@/pages/AreaPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const SnapPage = lazy(() => import('@/pages/SnapPage'));
const LetterPage = lazy(() => import('@/pages/LetterPage'));
const ActivityPage = lazy(() => import('@/pages/ActivityPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const CleanupPage = lazy(() => import('@/pages/CleanupPage'));
const NobinPage = lazy(() => import('@/pages/NobinPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyPage = lazy(() => import('@/pages/auth/VerifyPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <Routes>
        {/* App ke andar ke pages (TopBar + BottomNav ke saath) */}
        <Route element={<AppShell />}>
          {/* Public */}
          <Route index element={<MapPage />} />
          <Route path="site/:id" element={<SitePage />} />
          <Route path="areas" element={<AreasPage />} />
          <Route path="area/:id" element={<AreaPage />} />
          <Route path="about" element={<AboutPage />} />

          {/* Login zaroori */}
          <Route element={<ProtectedRoute />}>
            <Route path="snap" element={<SnapPage />} />
            <Route path="site/:id/cleaned" element={<CleanupPage />} />
            <Route path="letter/:id" element={<LetterPage />} />
            <Route path="nobin" element={<NobinPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          {/* Sirf admin */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="admin/*" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Auth pages (bina shell ke, login ke baad yahan nahi aa sakte) */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}