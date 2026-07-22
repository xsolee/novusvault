import type { DriveFolder, GoogleDriveConnection } from '@/types/domain';
import {
  mockConnectDrive,
  mockDisconnectDrive,
  mockGetDriveStatus,
  mockListFolders,
  mockSelectFolder,
} from '@/mocks/driveMock';

export const driveService = {
  async getStatus(): Promise<GoogleDriveConnection> {
    return mockGetDriveStatus();
  },
  async connect(): Promise<GoogleDriveConnection> {
    return mockConnectDrive();
  },
  async disconnect(): Promise<GoogleDriveConnection> {
    return mockDisconnectDrive();
  },
  async listFolders(parentId: string | null): Promise<DriveFolder[]> {
    return mockListFolders(parentId);
  },
  async selectFolder(folder: DriveFolder): Promise<GoogleDriveConnection> {
    return mockSelectFolder(folder);
  },
};
