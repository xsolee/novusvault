export type DocumentDepartment =
  | 'HUMAN_RESOURCES'
  | 'ACCOUNTING'
  | 'TREASURY'
  | 'FINANCE'
  | 'SALES'
  | 'OPERATIONS'
  | 'PROCUREMENT'
  | 'LEGAL'
  | 'INFORMATION_TECHNOLOGY'
  | 'ADMINISTRATION'
  | 'GENERAL'
  | 'UNKNOWN';

export type DocumentCategory =
  | 'POLICY'
  | 'PROCEDURE'
  | 'CONTRACT'
  | 'REPORT'
  | 'INVOICE'
  | 'RECEIPT'
  | 'SPREADSHEET'
  | 'PRESENTATION'
  | 'MEMO'
  | 'FORM'
  | 'MANUAL'
  | 'LETTER'
  | 'MEETING_NOTES'
  | 'OTHER';

export type DocumentProcessingStatus = 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  admin: AdminUser;
}

export type DriveConnectionState = 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED';

export interface GoogleDriveConnection {
  state: DriveConnectionState;
  googleAccountEmail?: string;
  rootFolder?: DriveFolder;
  lastSyncedAt?: string;
  totalFilesDiscovered: number;
  totalIndexed: number;
  totalFailed: number;
}

export interface DriveFolder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
}

export type SyncStage =
  | 'STARTING'
  | 'DISCOVERING_FILES'
  | 'DOWNLOADING_FILES'
  | 'EXTRACTING_TEXT'
  | 'RUNNING_OCR'
  | 'DETECTING_DEPARTMENT'
  | 'CREATING_EMBEDDINGS'
  | 'COMPLETED'
  | 'FAILED';

export type SyncStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED';

export interface SyncRun {
  id: string;
  status: SyncStatus;
  stage: SyncStage;
  startedAt: string;
  finishedAt?: string;
  totalFiles: number;
  processedFiles: number;
  successCount: number;
  failureCount: number;
  currentFilename?: string;
  progressPercent: number;
}

export interface DocumentSummary {
  id: string;
  filename: string;
  department: DocumentDepartment;
  category: DocumentCategory;
  source: 'GOOGLE_DRIVE';
  folderPath: string;
  status: DocumentProcessingStatus;
  indexedAt?: string;
}

export interface DocumentMetadata {
  title: string;
  department: DocumentDepartment;
  category: DocumentCategory;
  summary: string;
  topics: string[];
  importantDates: string[];
  people: string[];
  companies: string[];
}

export interface DocumentDetails extends DocumentSummary {
  mimeType: string;
  driveLink?: string;
  extractedText: string;
  metadata: DocumentMetadata;
}

export type ChatResponseType = 'answer' | 'clarification_required' | 'no_results' | 'error';

export interface ChatCitation {
  documentId: string;
  documentName: string;
  department: DocumentDepartment;
  pageNumber?: number;
  excerpt: string;
}

export interface ClarificationSuggestion {
  label: string;
  department: DocumentDepartment;
  topic: string;
}

export interface ChatResponse {
  type: ChatResponseType;
  message: string;
  detectedDepartment?: DocumentDepartment;
  detectedTopic?: string;
  citations?: ChatCitation[];
  suggestions?: ClarificationSuggestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  createdAt: string;
  text: string;
  response?: ChatResponse;
}

export interface ChatRequest {
  message: string;
  department?: DocumentDepartment;
  topic?: string;
}

export interface AppSettings {
  displayName: string;
  googleAccountEmail?: string;
  driveFolderName?: string;
  apiConnectionStatus: 'ONLINE' | 'OFFLINE';
}
