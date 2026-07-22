import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driveService } from '@/services/driveService';
import type { DriveFolder } from '@/types/domain';

export const driveKeys = {
  status: ['drive', 'status'] as const,
  folders: (parentId: string | null) => ['drive', 'folders', parentId] as const,
};

export function useDriveStatus() {
  return useQuery({ queryKey: driveKeys.status, queryFn: driveService.getStatus });
}

export function useConnectDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: driveService.connect,
    onSuccess: (data) => queryClient.setQueryData(driveKeys.status, data),
  });
}

export function useDisconnectDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: driveService.disconnect,
    onSuccess: (data) => queryClient.setQueryData(driveKeys.status, data),
  });
}

export function useDriveFolders(parentId: string | null, enabled = true) {
  return useQuery({
    queryKey: driveKeys.folders(parentId),
    queryFn: () => driveService.listFolders(parentId),
    enabled,
  });
}

export function useSelectDriveFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folder: DriveFolder) => driveService.selectFolder(folder),
    onSuccess: (data) => queryClient.setQueryData(driveKeys.status, data),
  });
}
