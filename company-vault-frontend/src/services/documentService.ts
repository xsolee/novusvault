import type {
  DocumentCategory,
  DocumentDepartment,
  DocumentDetails,
  DocumentProcessingStatus,
  DocumentSummary,
} from '@/types/domain';
import { apiClient } from './apiClient';

export interface DocumentFilters {
  search?: string;
  department?: DocumentDepartment;
  category?: DocumentCategory;
  status?: DocumentProcessingStatus;
  page?: number;
  pageSize?: number;
}

export interface DocumentPage {
  items: DocumentSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export const documentService = {
  async list(filters: DocumentFilters): Promise<DocumentPage> {
    const { data } = await apiClient.get<DocumentPage>('/documents', { params: filters });
    return data;
  },
  async getDetails(id: string): Promise<DocumentDetails> {
    const { data } = await apiClient.get<DocumentDetails>(`/documents/${id}`);
    return data;
  },
  async reprocess(id: string): Promise<DocumentSummary> {
    const { data } = await apiClient.post<DocumentSummary>(`/documents/${id}/reprocess`);
    return data;
  },
};
