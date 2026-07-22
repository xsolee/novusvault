import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/common/Card';
import { formatEnumLabel } from '@/components/common/Badge';
import { useSyncRun } from './useSync';
import { driveKeys } from './useDrive';
import type { SyncStage } from '@/types/domain';

const STAGE_ORDER: SyncStage[] = [
  'STARTING',
  'DISCOVERING_FILES',
  'DOWNLOADING_FILES',
  'EXTRACTING_TEXT',
  'RUNNING_OCR',
  'DETECTING_DEPARTMENT',
  'CREATING_EMBEDDINGS',
  'COMPLETED',
];

export function SyncPanel({ runId }: { runId: string }) {
  const { data: run } = useSyncRun(runId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (run && run.status !== 'RUNNING') {
      queryClient.invalidateQueries({ queryKey: driveKeys.status });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  }, [run?.status, queryClient]);

  if (!run) return null;

  const isDone = run.status !== 'RUNNING';
  const stageIndex = STAGE_ORDER.indexOf(run.stage);

  return (
    <Card>
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: isDone ? statusColor(run.status) : colors.info }]} />
        <Text style={typography.h3}>{isDone ? formatEnumLabel(run.status) : 'Synchronizing…'}</Text>
        <Text style={styles.percent}>{run.progressPercent}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${run.progressPercent}%`, backgroundColor: statusColor(run.status) }]} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{formatEnumLabel(run.stage)}</Text>
        {run.currentFilename ? <Text style={styles.metaText}>· {run.currentFilename}</Text> : null}
      </View>

      <View style={styles.statsRow}>
        <Stat label="Processed" value={`${run.processedFiles}/${run.totalFiles}`} />
        <Stat label="Succeeded" value={String(run.successCount)} icon="checkmark-circle" color={colors.accent} />
        <Stat label="Failed" value={String(run.failureCount)} icon="close-circle" color={colors.danger} />
      </View>

      <View style={styles.stageList}>
        {STAGE_ORDER.filter((s) => s !== 'COMPLETED').map((stage, idx) => (
          <View key={stage} style={styles.stageItem}>
            <Ionicons
              name={idx < stageIndex || isDone ? 'checkmark-circle' : idx === stageIndex ? 'ellipse' : 'ellipse-outline'}
              size={14}
              color={idx <= stageIndex || isDone ? colors.primary : colors.textFaint}
            />
            <Text style={[styles.stageLabel, (idx <= stageIndex || isDone) && { color: colors.text }]}>
              {formatEnumLabel(stage)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap; color?: string }) {
  return (
    <View style={styles.stat}>
      {icon ? <Ionicons name={icon} size={13} color={color} style={{ marginRight: 4 }} /> : null}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function statusColor(status: string) {
  if (status === 'FAILED') return colors.danger;
  if (status === 'COMPLETED_WITH_ERRORS') return colors.warning;
  if (status === 'COMPLETED') return colors.accent;
  return colors.primary;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  percent: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    ...typography.bodyMedium,
    color: colors.text,
    marginRight: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  stageList: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stageLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
