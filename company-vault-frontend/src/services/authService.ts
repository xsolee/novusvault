import type { AdminUser, AuthSession } from '@/types/domain';
import { apiClient } from './apiClient';

export const authService = {
  // POST /auth/dev-login only exists when the backend has ENABLE_DEV_LOGIN=true — the
  // real Google OAuth redirect flow isn't wired into the frontend yet (the backend's
  // /auth/google/callback redirects nowhere the app can intercept), so this is the
  // working real auth path for now. See CLAUDE.md.
  async devLogin(): Promise<AuthSession> {
    const { data } = await apiClient.post<AuthSession>('/auth/dev-login');
    return data;
  },
  async getCurrentAdmin(): Promise<AdminUser> {
    const { data } = await apiClient.get<AdminUser>('/auth/me');
    return data;
  },
  async refresh(refreshToken: string): Promise<AuthSession> {
    const { data } = await apiClient.post<AuthSession>('/auth/refresh', { refreshToken });
    return data;
  },
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
