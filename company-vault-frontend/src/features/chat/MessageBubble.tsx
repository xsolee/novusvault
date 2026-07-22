import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { DepartmentBadge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
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
  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  const response = message.response;

  return (
    <View style={styles.assistantRow}>
      <View style={styles.assistantIcon}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View style={styles.assistantContent}>
        {response?.detectedDepartment ? (
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Detected department</Text>
            <DepartmentBadge department={response.detectedDepartment} />
          </View>
        ) : null}

        <View
          style={[
            styles.assistantBubble,
            response?.type === 'error' && styles.assistantBubbleError,
            response?.type === 'no_results' && styles.assistantBubbleMuted,
          ]}
        >
          {response?.type === 'no_results' ? (
            <View style={styles.inlineIconRow}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
              <Text style={styles.mutedText}>{message.text}</Text>
            </View>
          ) : response?.type === 'error' ? (
            <View style={styles.inlineIconRow}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{message.text}</Text>
            </View>
          ) : (
            <Text style={styles.assistantText}>{message.text}</Text>
          )}
        </View>

        {response?.type === 'clarification_required' && response.suggestions ? (
          <ClarificationOptions suggestions={response.suggestions} onSelect={onSelectClarification} />
        ) : null}

        {response?.type === 'answer' && response.citations && response.citations.length > 0 ? (
          <View style={styles.citations}>
            <Text style={styles.citationsLabel}>Sources</Text>
            {response.citations.map((citation) => (
              <CitationCard key={`${citation.documentId}-${citation.pageNumber ?? 0}`} citation={citation} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  userText: {
    ...typography.body,
    color: colors.textInverse,
  },
  assistantRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    maxWidth: '86%',
  },
  assistantIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  assistantContent: {
    flex: 1,
  },
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detectedLabel: {
    ...typography.tiny,
    color: colors.textFaint,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  assistantBubbleMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  assistantBubbleError: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  assistantText: {
    ...typography.body,
    color: colors.text,
  },
  mutedText: {
    ...typography.body,
    color: colors.textMuted,
    flexShrink: 1,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    flexShrink: 1,
  },
  inlineIconRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  citations: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  citationsLabel: {
    ...typography.tiny,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
