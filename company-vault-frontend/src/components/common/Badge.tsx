import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, departmentColors, radius, spacing, typography } from '@/constants/theme';
import type { DocumentDepartment, DocumentProcessingStatus } from '@/types/domain';

export function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.tiny, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function DepartmentBadge({ department }: { department: DocumentDepartment }) {
  const c = departmentColors[department] ?? departmentColors.UNKNOWN;
  return <Badge label={formatEnumLabel(department)} fg={c.fg} bg={c.bg} />;
}

const STATUS_STYLE: Record<DocumentProcessingStatus, { fg: string; bg: string }> = {
  PENDING: { fg: colors.textMuted, bg: colors.surfaceMuted },
  PROCESSING: { fg: colors.info, bg: colors.infoSoft },
  INDEXED: { fg: colors.accent, bg: colors.accentSoft },
  FAILED: { fg: colors.danger, bg: colors.dangerSoft },
};

export function StatusBadge({ status }: { status: DocumentProcessingStatus }) {
  const c = STATUS_STYLE[status];
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
});
