import type { SyncRun } from '@/types/domain';
import { mockGetLatestSyncRun, mockGetSyncRun, mockStartSync } from '@/mocks/syncMock';

export const syncService = {
  async start(): Promise<SyncRun> {
    return mockStartSync();
  },
  async get(id: string): Promise<SyncRun> {
    return mockGetSyncRun(id);
  },
  async getLatest(): Promise<SyncRun | null> {
    return mockGetLatestSyncRun();
  },
};
