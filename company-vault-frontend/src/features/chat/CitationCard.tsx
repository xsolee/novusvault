import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DepartmentBadge } from '@/components/common/Badge';
import type { ChatCitation } from '@/types/domain';

export function CitationCard({ citation, index }: { citation: ChatCitation; index?: number }) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => router.push(`/documents/${citation.documentId}`)}
      style={({ hovered }: any) => [styles.row, hovered && { backgroundColor: colors.surfaceMuted }]}
    >
      {typeof index === 'number' ? (
        <View style={styles.num}>
          <Text style={styles.numText}>{index}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.filename} numberOfLines={1}>
          {citation.documentName}
        </Text>
        <View style={styles.metaRow}>
          <DepartmentBadge department={citation.department} />
          {citation.pageNumber ? <Text style={styles.page}>Page {citation.pageNumber}</Text> : null}
        </View>
        <Text style={styles.excerpt} numberOfLines={3}>
          “{citation.excerpt}”
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs + 2,
      borderRadius: radius.sm + 1,
      paddingVertical: spacing.xs + 1,
      paddingHorizontal: spacing.xs + 2,
    },
    num: {
      width: 18,
      height: 18,
      borderRadius: 5,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    numText: {
      ...typography.tiny,
      fontSize: 10,
      color: colors.primaryText,
    },
    filename: {
      ...typography.captionMedium,
      color: colors.text,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 4,
    },
    page: {
      ...typography.tiny,
      color: colors.textFaint,
      fontWeight: '400',
    },
    excerpt: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 4,
      fontStyle: 'italic',
    },
  });
