import type { DriveFolder, GoogleDriveConnection } from '@/types/domain';
import { apiClient } from './apiClient';

export const driveService = {
  async getStatus(): Promise<GoogleDriveConnection> {
    const { data } = await apiClient.get<GoogleDriveConnection>('/drive/status');
    return data;
  },
  // Unlike the other calls here, this isn't a self-contained round trip: it returns a
  // Google authorization URL that the caller must navigate to. Google then redirects the
  // browser to the backend's own callback, which redirects again to
  // `frontendDriveCallbackUrl` (`/drive?status=connected|failed`) — DriveScreen picks that
  // up via its status query param and refetches getStatus() itself.
  async getConnectUrl(): Promise<string> {
    const { data } = await apiClient.get<{ authorizationUrl: string }>('/drive/connect');
    return data.authorizationUrl;
  },
  async disconnect(): Promise<GoogleDriveConnection> {
    const { data } = await apiClient.delete<GoogleDriveConnection>('/drive/disconnect');
    return data;
  },
  async listFolders(parentId: string | null): Promise<DriveFolder[]> {
    const { data } = await apiClient.get<DriveFolder[]>('/drive/folders', {
      params: { parentId: parentId ?? undefined },
    });
    return data;
  },
  async selectFolder(folder: DriveFolder): Promise<GoogleDriveConnection> {
    const { data } = await apiClient.post<GoogleDriveConnection>('/drive/select-folder', folder);
    return data;
  },
};
