import type { ChatCitation, ChatRequest, ChatResponse, DocumentDepartment } from '@/types/domain';
import { delay, randomLatency } from './latency';
import { mockDocumentDetails } from './fixtures';

const DEPARTMENT_KEYWORDS: Array<{ department: DocumentDepartment; keywords: string[] }> = [
  { department: 'HUMAN_RESOURCES', keywords: ['leave', 'maternity', 'onboarding', 'handbook', 'employee', 'hr'] },
  { department: 'ACCOUNTING', keywords: ['reimbursement', 'expense', 'withholding tax', 'accounting'] },
  { department: 'TREASURY', keywords: ['treasury', 'payment release', 'outgoing payment'] },
  { department: 'PROCUREMENT', keywords: ['vendor', 'procurement', 'accreditation', 'purchase order'] },
  { department: 'LEGAL', keywords: ['contract', 'acme', 'agreement', 'legal'] },
  { department: 'FINANCE', keywords: ['financial report', 'budget', 'finance'] },
  { department: 'INFORMATION_TECHNOLOGY', keywords: ['access request', 'password', 'it ticket'] },
];

const BROAD_TERMS = ['approval process', 'the process', 'policy', 'requirements', 'the rules', 'documents'];

const APPROVAL_SUGGESTIONS = [
  { label: 'Human Resources leave approval', department: 'HUMAN_RESOURCES' as const, topic: 'Leave approval' },
  { label: 'Accounting expense approval', department: 'ACCOUNTING' as const, topic: 'Expense approval' },
  { label: 'Treasury payment approval', department: 'TREASURY' as const, topic: 'Payment approval' },
  { label: 'Procurement purchase approval', department: 'PROCUREMENT' as const, topic: 'Purchase approval' },
];

function detectDepartment(text: string): { department: DocumentDepartment; confidence: number } | null {
  const lower = text.toLowerCase();
  let best: { department: DocumentDepartment; score: number } | null = null;

  for (const entry of DEPARTMENT_KEYWORDS) {
    const score = entry.keywords.filter((k) => lower.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { department: entry.department, score };
    }
  }

  if (!best) return null;
  return { department: best.department, confidence: Math.min(0.95, 0.6 + best.score * 0.15) };
}

function isBroadQuestion(text: string, detected: { confidence: number } | null): boolean {
  const lower = text.toLowerCase();
  const mentionsBroadTerm = BROAD_TERMS.some((term) => lower.includes(term));
  const lowConfidence = !detected || detected.confidence < 0.65;
  return mentionsBroadTerm && lowConfidence;
}

function buildCitations(department: DocumentDepartment): ChatCitation[] {
  return Object.values(mockDocumentDetails)
    .filter((doc) => doc.department === department)
    .slice(0, 2)
    .map((doc) => ({
      documentId: doc.id,
      documentName: doc.filename,
      department: doc.department,
      pageNumber: doc.department === 'HUMAN_RESOURCES' ? 14 : undefined,
      excerpt: doc.extractedText.slice(0, 180).trim() + '...',
    }));
}

export async function mockSendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  await delay(null, randomLatency(900, 1700));

  const detected = detectDepartment(request.message);

  if (isBroadQuestion(request.message, detected)) {
    return {
      type: 'clarification_required',
      message: 'Which approval process are you asking about?',
      suggestions: APPROVAL_SUGGESTIONS,
    };
  }

  if (!detected) {
    return {
      type: 'no_results',
      message:
        'I could not find enough information in the indexed company documents to answer that. Try rephrasing, or pick a department in Documents to browse what is indexed.',
      citations: [],
    };
  }

  const citations = buildCitations(detected.department);
  if (citations.length === 0) {
    return {
      type: 'no_results',
      message: `I found a likely department (${detected.department.replace('_', ' ')}) but no indexed documents currently support an answer.`,
      detectedDepartment: detected.department,
      citations: [],
    };
  }

  return {
    type: 'answer',
    message: buildAnswerMessage(detected.department, citations[0].excerpt),
    detectedDepartment: detected.department,
    detectedTopic: guessTopic(request.message),
    citations,
  };
}

function guessTopic(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('maternity')) return 'Maternity leave';
  if (lower.includes('leave')) return 'Leave policy';
  if (lower.includes('reimbursement') || lower.includes('expense')) return 'Expense reimbursement';
  if (lower.includes('payment')) return 'Payment procedure';
  if (lower.includes('vendor') || lower.includes('accreditation')) return 'Vendor accreditation';
  return 'General inquiry';
}

function buildAnswerMessage(department: DocumentDepartment, excerpt: string): string {
  const label = department.replace(/_/g, ' ').toLowerCase();
  return `Based on the indexed ${label} documents: ${excerpt} This is drawn directly from the cited document below — see the citation for full context.`;
}
