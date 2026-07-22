import type { AdminUser, AuthSession } from '@/types/domain';
import { mockGetCurrentAdmin, mockLoginWithGoogle, mockLogout } from '@/mocks/authMock';

export const authService = {
  async loginWithGoogle(): Promise<AuthSession> {
    return mockLoginWithGoogle();
  },
  async getCurrentAdmin(token: string): Promise<AdminUser> {
    return mockGetCurrentAdmin(token);
  },
  async logout(): Promise<void> {
    return mockLogout();
  },
};
