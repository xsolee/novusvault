import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { syncService } from '@/services/syncService';
import { driveKeys } from './useDrive';

export const syncKeys = {
  run: (id: string) => ['sync', 'run', id] as const,
  latest: ['sync', 'latest'] as const,
};

export function useLatestSyncRun() {
  return useQuery({ queryKey: syncKeys.latest, queryFn: syncService.getLatest });
}

export function useSyncRun(id: string | null) {
  return useQuery({
    queryKey: id ? syncKeys.run(id) : ['sync', 'run', 'idle'],
    queryFn: () => syncService.get(id as string),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'RUNNING' || !status ? 700 : false;
    },
  });
}

export function useStartSync() {
  const queryClient = useQueryClient();
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: syncService.start,
    onSuccess: (run) => {
      setActiveRunId(run.id);
      queryClient.invalidateQueries({ queryKey: driveKeys.status });
    },
  });

  return { ...mutation, activeRunId, setActiveRunId };
}
