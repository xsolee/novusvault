import type { AppSettings } from '@/types/domain';
import { apiClient } from './apiClient';

export const settingsService = {
  async get(): Promise<AppSettings> {
    const { data } = await apiClient.get<AppSettings>('/settings');
    return data;
  },
};
