import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  return {
    user,
    status,
    isAuthed: status === 'authed',
    isAdmin: user?.role === 'admin',
    login,
    logout,
  };
}
