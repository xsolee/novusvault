import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DepartmentBadge, StatusBadge } from '@/components/common/Badge';
import type { DocumentSummary } from '@/types/domain';

function extFor(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase() ?? 'DOC';
  return ext.length > 4 ? 'DOC' : ext;
}

export function DocumentRow({ document, onPress }: { document: DocumentSummary; onPress: () => void }) {
  const { colors, departmentColors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const deptColor = departmentColors[document.department] ?? departmentColors.UNKNOWN;

  return (
    <Pressable onPress={onPress} style={({ hovered }: any) => [styles.row, hovered && styles.rowHover]}>
      <View style={[styles.iconWrap, { backgroundColor: deptColor.bg }]}>
        <Text style={[styles.iconText, { color: deptColor.fg }]}>{extFor(document.filename)}</Text>
      </View>
      <View style={styles.main}>
        <Text style={[typography.bodyMedium, { color: colors.text }]} numberOfLines={1}>
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.3,
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
