import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DepartmentBadge } from '@/components/common/Badge';
import type { ChatMessage, ClarificationSuggestion } from '@/types/domain';
import { CitationCard } from './CitationCard';
import { ClarificationOptions } from './ClarificationOptions';

export function MessageBubble({
  message,
  onSelectClarification,
}: {
  message: ChatMessage;
  onSelectClarification: (suggestion: ClarificationSuggestion) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={[typography.body, { color: colors.textInverse }]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  const response = message.response;
  const isError = response?.type === 'error';
  const isNoResults = response?.type === 'no_results';
  const citations = response?.type === 'answer' ? response.citations ?? [] : [];

  return (
    <View style={[styles.card, isError && styles.cardError]}>
      <View style={styles.metaRow}>
        <Text style={styles.who}>Company Vault</Text>
        {response?.detectedDepartment ? <DepartmentBadge department={response.detectedDepartment} /> : null}
        {response?.detectedTopic ? (
          <View style={styles.topicChip}>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>{response.detectedTopic}</Text>
          </View>
        ) : null}
        {response?.type === 'clarification_required' ? (
          <View style={styles.topicChip}>
            <Text style={[typography.tiny, { color: colors.textMuted }]}>Needs one detail</Text>
          </View>
        ) : null}
      </View>

      {isNoResults ? (
        <View style={styles.inlineIconRow}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
          <Text style={[typography.body, { color: colors.textMuted, flexShrink: 1 }]}>{message.text}</Text>
        </View>
      ) : isError ? (
        <View style={styles.inlineIconRow}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={[typography.body, { color: colors.danger, flexShrink: 1 }]}>{message.text}</Text>
        </View>
      ) : (
        <Text style={[typography.body, { color: colors.text }]}>{message.text}</Text>
      )}

      {response?.type === 'clarification_required' && response.suggestions ? (
        <ClarificationOptions suggestions={response.suggestions} onSelect={onSelectClarification} />
      ) : null}

      {citations.length > 0 ? (
        <View style={styles.sources}>
          <Text style={styles.sourcesLabel}>
            Sources · {citations.length} document{citations.length === 1 ? '' : 's'}
          </Text>
          {citations.map((citation, i) => (
            <CitationCard
              key={`${citation.documentId}-${citation.pageNumber ?? 0}`}
              citation={citation}
              index={i + 1}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    userRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: spacing.md,
    },
    userBubble: {
      maxWidth: '82%',
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      borderBottomRightRadius: radius.sm - 4,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg - 2,
      padding: spacing.md + 2,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    cardError: {
      borderColor: colors.dangerSoft,
      backgroundColor: colors.dangerSoft,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.xs + 2,
    },
    who: {
      ...typography.tiny,
      fontSize: 10,
      color: colors.textFaint,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    topicChip: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.pill,
      paddingVertical: 3,
      paddingHorizontal: spacing.xs,
    },
    inlineIconRow: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'flex-start',
    },
    sources: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm + 2,
      paddingTop: spacing.sm,
      gap: 2,
    },
    sourcesLabel: {
      ...typography.tiny,
      fontSize: 10,
      color: colors.textFaint,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.xxs,
    },
  });
