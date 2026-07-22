import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { DepartmentBadge, StatusBadge } from '@/components/common/Badge';
import type { DocumentSummary } from '@/types/domain';

const FILE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text-outline',
  docx: 'document-outline',
  jpg: 'image-outline',
  jpeg: 'image-outline',
  png: 'image-outline',
};

function iconFor(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return FILE_ICON[ext] ?? 'document-outline';
}

export function DocumentRow({ document, onPress }: { document: DocumentSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ hovered }: any) => [styles.row, hovered && styles.rowHover]}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconFor(document.filename)} size={17} color={colors.textMuted} />
      </View>
      <View style={styles.main}>
        <Text style={typography.bodyMedium} numberOfLines={1}>
          {document.filename}
        </Text>
        <Text style={styles.path} numberOfLines={1}>
          {document.folderPath}
        </Text>
      </View>
      <DepartmentBadge department={document.department} />
      <StatusBadge status={document.status} />
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowHover: {
    backgroundColor: colors.surfaceMuted,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    minWidth: 120,
  },
  path: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 1,
  },
});
