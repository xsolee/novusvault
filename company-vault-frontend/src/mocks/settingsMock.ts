import type { AppSettings } from '@/types/domain';
import { delay, randomLatency } from './latency';
import { mockAdmin, mockDriveConnection } from './fixtures';

export async function mockGetSettings(): Promise<AppSettings> {
  await delay(null, randomLatency());
  return {
    displayName: mockAdmin.name,
    googleAccountEmail: mockDriveConnection.googleAccountEmail,
    driveFolderName: mockDriveConnection.rootFolder?.name,
    apiConnectionStatus: 'ONLINE',
  };
}
