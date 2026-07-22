import type { DocumentDetails, DocumentSummary } from '@/types/domain';
import {
  mockGetDocumentDetails,
  mockListDocuments,
  mockReprocessDocument,
  type DocumentFilters,
  type DocumentPage,
} from '@/mocks/documentMock';

export type { DocumentFilters, DocumentPage };

export const documentService = {
  async list(filters: DocumentFilters): Promise<DocumentPage> {
    return mockListDocuments(filters);
  },
  async getDetails(id: string): Promise<DocumentDetails> {
    return mockGetDocumentDetails(id);
  },
  async reprocess(id: string): Promise<DocumentSummary> {
    return mockReprocessDocument(id);
  },
};
