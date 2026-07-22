import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { DepartmentBadge } from '@/components/common/Badge';
import type { ChatCitation } from '@/types/domain';

export function CitationCard({ citation }: { citation: ChatCitation }) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={15} color={colors.textMuted} />
        <Text style={styles.filename} numberOfLines={1}>
          {citation.documentName}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <DepartmentBadge department={citation.department} />
        {citation.pageNumber ? <Text style={styles.page}>Page {citation.pageNumber}</Text> : null}
      </View>
      <Text style={styles.excerpt} numberOfLines={3}>
        “{citation.excerpt}”
      </Text>
      <Pressable onPress={() => router.push(`/documents/${citation.documentId}`)} style={styles.linkRow}>
        <Text style={styles.linkText}>Open document</Text>
        <Ionicons name="arrow-forward" size={12} color={colors.primaryText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filename: {
    ...typography.captionMedium,
    color: colors.text,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 6,
  },
  page: {
    ...typography.tiny,
    color: colors.textFaint,
  },
  excerpt: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  linkText: {
    ...typography.tiny,
    color: colors.primaryText,
  },
});
