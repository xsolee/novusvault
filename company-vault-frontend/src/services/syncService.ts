import type { SyncRun } from '@/types/domain';
import { apiClient } from './apiClient';

export const syncService = {
  async start(): Promise<SyncRun> {
    const { data } = await apiClient.post<SyncRun>('/sync');
    return data;
  },
  async get(id: string): Promise<SyncRun> {
    const { data } = await apiClient.get<SyncRun>(`/sync/${id}`);
    return data;
  },
  async getLatest(): Promise<SyncRun | null> {
    const { data } = await apiClient.get<{ items: SyncRun[] }>('/sync', {
      params: { page: 1, pageSize: 1 },
    });
    return data.items[0] ?? null;
  },
};
