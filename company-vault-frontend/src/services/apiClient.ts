import axios from 'axios';
import { env } from '@/constants/env';

/**
 * Axios instance for the real backend. Not yet wired into the services below —
 * every service currently delegates to src/mocks/*. Swap a service's implementation
 * to call `apiClient` instead of a mock without changing any screen or hook.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

let authToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function getApiAuthToken() {
  return authToken;
}
