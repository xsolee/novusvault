import type { SyncRun, SyncStage } from '@/types/domain';
import { delay, randomLatency } from './latency';

const STAGES: SyncStage[] = [
  'STARTING',
  'DISCOVERING_FILES',
  'DOWNLOADING_FILES',
  'EXTRACTING_TEXT',
  'RUNNING_OCR',
  'DETECTING_DEPARTMENT',
  'CREATING_EMBEDDINGS',
  'COMPLETED',
];

const TOTAL_FILES = 16;
const RUN_DURATION_MS = 9000;

let activeRun: { id: string; startedAt: number } | null = null;
let lastCompletedRun: SyncRun | null = null;

function computeRun(id: string, startedAt: number): SyncRun {
  const elapsed = Date.now() - startedAt;
  const progressPercent = Math.min(100, Math.round((elapsed / RUN_DURATION_MS) * 100));
  const stageIndex = Math.min(STAGES.length - 1, Math.floor((progressPercent / 100) * STAGES.length));
  const stage = STAGES[stageIndex];
  const processedFiles = Math.min(TOTAL_FILES, Math.round((progressPercent / 100) * TOTAL_FILES));
  const failureCount = progressPercent > 60 ? 1 : 0;
  const completed = progressPercent >= 100;

  return {
    id,
    status: completed ? (failureCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED') : 'RUNNING',
    stage: completed ? 'COMPLETED' : stage,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: completed ? new Date(startedAt + RUN_DURATION_MS).toISOString() : undefined,
    totalFiles: TOTAL_FILES,
    processedFiles,
    successCount: Math.max(0, processedFiles - failureCount),
    failureCount,
    currentFilename: completed ? undefined : `document-${processedFiles + 1}.pdf`,
    progressPercent,
  };
}

export async function mockStartSync(): Promise<SyncRun> {
  await delay(null, randomLatency(300, 600));
  if (activeRun) {
    const current = computeRun(activeRun.id, activeRun.startedAt);
    if (current.status === 'RUNNING') {
      return current;
    }
  }
  activeRun = { id: `sync-${Date.now()}`, startedAt: Date.now() };
  return computeRun(activeRun.id, activeRun.startedAt);
}

export async function mockGetSyncRun(id: string): Promise<SyncRun> {
  await delay(null, randomLatency(150, 300));
  if (activeRun && activeRun.id === id) {
    const run = computeRun(activeRun.id, activeRun.startedAt);
    if (run.status !== 'RUNNING') {
      lastCompletedRun = run;
      activeRun = null;
    }
    return run;
  }
  if (lastCompletedRun && lastCompletedRun.id === id) return lastCompletedRun;
  throw new Error('Sync run not found');
}

export async function mockGetLatestSyncRun(): Promise<SyncRun | null> {
  await delay(null, randomLatency());
  if (activeRun) return computeRun(activeRun.id, activeRun.startedAt);
  return lastCompletedRun;
}
