import axios from 'axios';
import { env } from '@/constants/env';

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

// Registered by useAuth.tsx once it mounts, so apiClient can trigger a refresh without
// importing useAuth directly (would be circular — useAuth imports apiClient already).
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setRefreshHandler(fn: (() => Promise<string | null>) | null) {
  refreshHandler = fn;
}

// Registered before the error-normalization interceptor below: axios runs response
// interceptors' rejection handlers in registration order, so this one must see the raw
// AxiosError (with .response.status intact) before it gets flattened into a plain Error.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      refreshHandler
    ) {
      original._retry = true;
      const newToken = await refreshHandler();
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);

// Backend errors are {"errorCode", "message"} (app/core/exceptions.py) — normalize to a
// plain Error so existing `e instanceof Error ? e.message : ...` call sites work unchanged.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message as string));
    }
    return Promise.reject(error);
  },
);
