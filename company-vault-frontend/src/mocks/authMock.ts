import type { AuthSession } from '@/types/domain';
import { delay, randomLatency } from './latency';
import { mockAdmin } from './fixtures';

let failNextLogin = false;

export function setMockLoginShouldFail(shouldFail: boolean) {
  failNextLogin = shouldFail;
}

export async function mockLoginWithGoogle(): Promise<AuthSession> {
  await delay(null, randomLatency(700, 1300));
  if (failNextLogin) {
    failNextLogin = false;
    throw new Error('Google sign-in was cancelled or failed. Please try again.');
  }
  return { token: 'mock-session-token', admin: mockAdmin };
}

export async function mockGetCurrentAdmin(token: string) {
  await delay(null, randomLatency());
  if (!token) throw new Error('Not authenticated');
  return mockAdmin;
}

export async function mockLogout(): Promise<void> {
  await delay(undefined, randomLatency(200, 400));
}
