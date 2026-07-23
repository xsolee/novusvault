import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { DocumentDepartment, DocumentProcessingStatus } from '@/types/domain';

export function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.tiny, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function DepartmentBadge({ department }: { department: DocumentDepartment }) {
  const { departmentColors } = useTheme();
  const c = departmentColors[department] ?? departmentColors.UNKNOWN;
  return (
    <View style={[styles.badge, styles.dotBadge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.fg }]} />
      <Text style={[typography.tiny, { color: c.fg }]}>{formatEnumLabel(department)}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: DocumentProcessingStatus }) {
  const { colors } = useTheme();
  const map: Record<DocumentProcessingStatus, { fg: string; bg: string }> = {
    PENDING: { fg: colors.textMuted, bg: colors.surfaceMuted },
    PROCESSING: { fg: colors.info, bg: colors.infoSoft },
    INDEXED: { fg: colors.accent, bg: colors.accentSoft },
    FAILED: { fg: colors.danger, bg: colors.dangerSoft },
  };
  const c = map[status];
  return <Badge label={formatEnumLabel(status)} fg={c.fg} bg={c.bg} />;
}

export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  dotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
