import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentService, type DocumentFilters } from '@/services/documentService';

export const documentKeys = {
  list: (filters: DocumentFilters) => ['documents', 'list', filters] as const,
  details: (id: string) => ['documents', 'details', id] as const,
};

export function useDocuments(filters: DocumentFilters) {
  return useQuery({ queryKey: documentKeys.list(filters), queryFn: () => documentService.list(filters) });
}

export function useDocumentDetails(id: string) {
  return useQuery({ queryKey: documentKeys.details(id), queryFn: () => documentService.getDetails(id) });
}

export function useReprocessDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.reprocess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
