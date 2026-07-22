import type { AppSettings } from '@/types/domain';
import { mockGetSettings } from '@/mocks/settingsMock';

export const settingsService = {
  async get(): Promise<AppSettings> {
    return mockGetSettings();
  },
};
