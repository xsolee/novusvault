import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'company-vault.session-token';

/**
 * expo-secure-store has no web implementation, so web falls back to localStorage.
 * The app only ever stores the Company Vault session token here — never Google tokens.
 */
export const sessionStorage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(SESSION_KEY);
    }
    return SecureStore.getItemAsync(SESSION_KEY);
  },
  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(SESSION_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(SESSION_KEY, token);
  },
  async clearToken(): Promise<void> {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
