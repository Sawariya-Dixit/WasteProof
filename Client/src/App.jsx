import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute, { GuestRoute } from '@/auth/ProtectedRoute';

import MapPage from '@/pages/MapPage';
import SitePage from '@/pages/SitePage';
import AreasPage from '@/pages/AreasPage';
import AreaPage from '@/pages/AreaPage';
import AboutPage from '@/pages/AboutPage';
import SnapPage from '@/pages/SnapPage';
import LetterPage from '@/pages/LetterPage';
import ActivityPage from '@/pages/ActivityPage';
import AccountPage from '@/pages/AccountPage';
import AdminPage from '@/pages/admin/AdminPage';
import NotFoundPage from '@/pages/NotFoundPage';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VerifyPage from '@/pages/auth/VerifyPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

export function AppRoutes() {
  return (
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
          <Route path="letter/:id" element={<LetterPage />} />
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
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
