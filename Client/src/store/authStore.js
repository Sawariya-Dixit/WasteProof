import { create } from 'zustand';
import { getIdToken, loginUser, logoutUser } from '@/auth/cognito';
import { fetchMe } from '@/api/users';

export const useAuthStore = create((set) => ({
  user: null, // backend ka user (id, email, role...)
  status: 'loading', // loading | authed | anon

  // App start par ek baar: token hai to backend se profile lo
  async init() {
    const token = await getIdToken();
    if (!token) return set({ user: null, status: 'anon' });
    try {
      const user = await fetchMe();
      set({ user, status: 'authed' });
    } catch {
      set({ user: null, status: 'anon' });
    }
  },

  async login(email, password) {
    const res = await loginUser(email, password);
    if (res.nextStep?.signInStep === 'CONFIRM_SIGN_UP') return { needsVerify: true };
    if (!res.isSignedIn) return { ok: false, step: res.nextStep?.signInStep };
    const user = await fetchMe();
    set({ user, status: 'authed' });
    return { ok: true };
  },

  async logout() {
    try {
      await logoutUser();
    } catch {
      /* session pehle hi khatam ho sakta hai */
    }
    set({ user: null, status: 'anon' });
  },
}));
