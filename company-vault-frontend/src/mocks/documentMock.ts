import type {
  DocumentCategory,
  DocumentDepartment,
  DocumentDetails,
  DocumentProcessingStatus,
  DocumentSummary,
} from '@/types/domain';
import { delay, randomLatency } from './latency';
import { mockDocumentDetails, mockDocuments } from './fixtures';

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

const documents = [...mockDocuments];

export async function mockListDocuments(filters: DocumentFilters = {}): Promise<DocumentPage> {
  await delay(null, randomLatency());
  const { search, department, category, status, page = 1, pageSize = 10 } = filters;

  let filtered = documents;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((d) => d.filename.toLowerCase().includes(q));
  }
  if (department) filtered = filtered.filter((d) => d.department === department);
  if (category) filtered = filtered.filter((d) => d.category === category);
  if (status) filtered = filtered.filter((d) => d.status === status);

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total: filtered.length, page, pageSize };
}

export async function mockGetDocumentDetails(id: string): Promise<DocumentDetails> {
  await delay(null, randomLatency());
  const details = mockDocumentDetails[id];
  if (details) return details;

  const summary = documents.find((d) => d.id === id);
  if (!summary) throw new Error('Document not found');

  return {
    ...summary,
    mimeType: 'application/pdf',
    extractedText: 'No extracted text preview is available for this document yet.',
    metadata: {
      title: summary.filename,
      department: summary.department,
      category: summary.category,
      summary: 'This document has not been fully processed yet.',
      topics: [],
      importantDates: [],
      people: [],
      companies: [],
    },
  };
}

export async function mockReprocessDocument(id: string): Promise<DocumentSummary> {
  await delay(null, randomLatency(600, 1200));
  const doc = documents.find((d) => d.id === id);
  if (!doc) throw new Error('Document not found');
  doc.status = 'PROCESSING';
  setTimeout(() => {
    doc.status = 'INDEXED';
    doc.indexedAt = new Date().toISOString();
  }, 2000);
  return { ...doc };
}
