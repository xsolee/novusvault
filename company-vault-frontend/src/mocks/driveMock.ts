import type { DriveFolder, GoogleDriveConnection } from '@/types/domain';
import { delay, randomLatency } from './latency';
import { mockDriveConnection, mockFolderTree } from './fixtures';

let connection: GoogleDriveConnection = { ...mockDriveConnection };

export async function mockGetDriveStatus(): Promise<GoogleDriveConnection> {
  await delay(null, randomLatency());
  return { ...connection };
}

export async function mockConnectDrive(): Promise<GoogleDriveConnection> {
  await delay(null, randomLatency(900, 1500));
  connection = {
    ...connection,
    state: 'CONNECTED',
    googleAccountEmail: 'ambrosiussolee@gmail.com',
  };
  return { ...connection };
}

export async function mockDisconnectDrive(): Promise<GoogleDriveConnection> {
  await delay(null, randomLatency());
  connection = {
    state: 'NOT_CONNECTED',
    totalFilesDiscovered: 0,
    totalIndexed: 0,
    totalFailed: 0,
  };
  return { ...connection };
}

export async function mockListFolders(parentId: string | null): Promise<DriveFolder[]> {
  await delay(null, randomLatency());
  return mockFolderTree[parentId ?? 'root'] ?? [];
}

export async function mockSelectFolder(folder: DriveFolder): Promise<GoogleDriveConnection> {
  await delay(null, randomLatency());
  connection = { ...connection, rootFolder: folder };
  return { ...connection };
}
