import type {
  AdminUser,
  ChatMessage,
  DocumentDetails,
  DocumentSummary,
  DriveFolder,
  GoogleDriveConnection,
} from '@/types/domain';

export const mockAdmin: AdminUser = {
  id: 'admin-1',
  name: 'Ambrosius Sole',
  email: 'ambrosiussolee@gmail.com',
};

export const mockDriveConnection: GoogleDriveConnection = {
  state: 'CONNECTED',
  googleAccountEmail: 'ambrosiussolee@gmail.com',
  rootFolder: { id: 'root-1', name: 'Company Documents', path: '/Company Documents', parentId: null },
  lastSyncedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  totalFilesDiscovered: 128,
  totalIndexed: 112,
  totalFailed: 3,
};

export const mockFolderTree: Record<string, DriveFolder[]> = {
  root: [
    { id: 'root-1', name: 'Company Documents', path: '/Company Documents', parentId: null },
  ],
  'root-1': [
    { id: 'f-hr', name: 'Human Resources', path: '/Company Documents/Human Resources', parentId: 'root-1' },
    { id: 'f-fin', name: 'Finance', path: '/Company Documents/Finance', parentId: 'root-1' },
    { id: 'f-legal', name: 'Legal', path: '/Company Documents/Legal', parentId: 'root-1' },
    { id: 'f-it', name: 'IT', path: '/Company Documents/IT', parentId: 'root-1' },
  ],
  'f-hr': [
    { id: 'f-hr-policies', name: 'Policies', path: '/Company Documents/Human Resources/Policies', parentId: 'f-hr' },
  ],
  'f-fin': [
    { id: 'f-fin-reports', name: 'Reports', path: '/Company Documents/Finance/Reports', parentId: 'f-fin' },
  ],
};

export const mockDocuments: DocumentSummary[] = [
  {
    id: 'doc-1',
    filename: 'Employee Handbook.pdf',
    department: 'HUMAN_RESOURCES',
    category: 'POLICY',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Human Resources/Policies',
    status: 'INDEXED',
    indexedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'doc-2',
    filename: 'Leave Approval Procedure.docx',
    department: 'HUMAN_RESOURCES',
    category: 'PROCEDURE',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Human Resources/Policies',
    status: 'INDEXED',
    indexedAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
  },
  {
    id: 'doc-3',
    filename: 'Q2 Financial Report.pdf',
    department: 'FINANCE',
    category: 'REPORT',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Finance/Reports',
    status: 'INDEXED',
    indexedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: 'doc-4',
    filename: 'Vendor Accreditation Manual.pdf',
    department: 'PROCUREMENT',
    category: 'MANUAL',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Procurement',
    status: 'INDEXED',
    indexedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
  {
    id: 'doc-5',
    filename: 'Expense Reimbursement Form.pdf',
    department: 'ACCOUNTING',
    category: 'FORM',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Accounting',
    status: 'INDEXED',
    indexedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'doc-6',
    filename: 'Treasury Payment Procedure.pdf',
    department: 'TREASURY',
    category: 'PROCEDURE',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Treasury',
    status: 'INDEXED',
    indexedAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
  },
  {
    id: 'doc-7',
    filename: 'Supplier Contract - Acme Corp.pdf',
    department: 'LEGAL',
    category: 'CONTRACT',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Legal',
    status: 'PROCESSING',
  },
  {
    id: 'doc-8',
    filename: 'Scanned Invoice - Batch 12.jpg',
    department: 'UNKNOWN',
    category: 'INVOICE',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Accounting/Invoices',
    status: 'FAILED',
  },
  {
    id: 'doc-9',
    filename: 'Onboarding Checklist.docx',
    department: 'HUMAN_RESOURCES',
    category: 'PROCEDURE',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/Human Resources',
    status: 'INDEXED',
    indexedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: 'doc-10',
    filename: 'IT Access Request Form.pdf',
    department: 'INFORMATION_TECHNOLOGY',
    category: 'FORM',
    source: 'GOOGLE_DRIVE',
    folderPath: '/Company Documents/IT',
    status: 'PENDING',
  },
];

export const mockDocumentDetails: Record<string, DocumentDetails> = {
  'doc-1': {
    ...mockDocuments[0],
    mimeType: 'application/pdf',
    driveLink: 'https://drive.google.com/file/d/mock-doc-1',
    extractedText:
      'Section 4: Leave Policy\n\nEligible employees are entitled to twenty (20) days of paid annual leave per calendar year, ' +
      'in addition to statutory holidays. Maternity leave is granted for one hundred five (105) days in accordance with ' +
      'applicable law. Requests must be submitted through the HR portal at least five (5) working days in advance for ' +
      'planned leave...',
    metadata: {
      title: 'Employee Handbook',
      department: 'HUMAN_RESOURCES',
      category: 'POLICY',
      summary:
        'Company-wide handbook covering leave policy, code of conduct, and employee benefits, including maternity leave entitlements.',
      topics: ['Leave policy', 'Maternity leave', 'Code of conduct', 'Employee benefits'],
      importantDates: ['Effective January 1, 2025'],
      people: [],
      companies: ['Company Vault Inc.'],
    },
  },
  'doc-6': {
    ...mockDocuments[5],
    mimeType: 'application/pdf',
    driveLink: 'https://drive.google.com/file/d/mock-doc-6',
    extractedText:
      'Treasury Payment Procedure\n\nAll outgoing payments above $5,000 require dual approval from the Treasury Manager ' +
      'and the CFO. Payment requests are initiated through the Treasury portal and must include supporting documentation...',
    metadata: {
      title: 'Treasury Payment Procedure',
      department: 'TREASURY',
      category: 'PROCEDURE',
      summary: 'Defines the dual-approval workflow required for outgoing treasury payments above $5,000.',
      topics: ['Payment approval', 'Dual authorization', 'Treasury controls'],
      importantDates: [],
      people: [],
      companies: [],
    },
  },
};

export const mockDepartmentBreakdown = [
  { department: 'HUMAN_RESOURCES' as const, count: 3 },
  { department: 'FINANCE' as const, count: 1 },
  { department: 'ACCOUNTING' as const, count: 1 },
  { department: 'TREASURY' as const, count: 1 },
  { department: 'LEGAL' as const, count: 1 },
  { department: 'PROCUREMENT' as const, count: 1 },
  { department: 'INFORMATION_TECHNOLOGY' as const, count: 1 },
];

export const mockSuggestedQuestions: string[] = [
  'What is our maternity leave policy?',
  'What documents mention Acme Corp?',
  'What are the requirements for reimbursement?',
  'What treasury procedures are available?',
  'Summarize the latest company policies.',
  "What does the procurement manual say about vendor accreditation?",
];

export const mockChatHistory: ChatMessage[] = [];
