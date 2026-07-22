import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/constants/theme';
import { IconButton } from '@/components/common/IconButton';
import { DepartmentBadge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ChatMessage } from '@/types/domain';
import { CitationCard } from './CitationCard';

export function ChatDetailsPanel({ latestAnswer, onClose }: { latestAnswer: ChatMessage | null; onClose: () => void }) {
  const response = latestAnswer?.response;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="information-circle-outline" size={17} color={colors.text} />
          <Text style={typography.h3}>Details</Text>
        </View>
        <IconButton icon="close" accessibilityLabel="Close details panel" onPress={onClose} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {!response ? (
          <EmptyState
            icon="sparkles-outline"
            title="Nothing yet"
            description="Ask a question to see the detected department, applied filters, and citations here."
          />
        ) : (
          <>
            <Section label="Detected department">
              {response.detectedDepartment ? (
                <DepartmentBadge department={response.detectedDepartment} />
              ) : (
                <Text style={styles.mutedText}>Not detected</Text>
              )}
            </Section>

            {response.detectedTopic ? (
              <Section label="Detected topic">
                <Text style={styles.value}>{response.detectedTopic}</Text>
              </Section>
            ) : null}

            <Section label="Response type">
              <Text style={styles.value}>{formatType(response.type)}</Text>
            </Section>

            {response.citations && response.citations.length > 0 ? (
              <Section label={`Citations (${response.citations.length})`}>
                <View style={{ gap: spacing.xs }}>
                  {response.citations.map((citation) => (
                    <CitationCard key={`${citation.documentId}-${citation.pageNumber ?? 0}`} citation={citation} />
                  ))}
                </View>
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function formatType(type: string) {
  return type
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    backgroundColor: colors.surface,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  body: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.tiny,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  value: {
    ...typography.body,
    color: colors.text,
  },
  mutedText: {
    ...typography.body,
    color: colors.textFaint,
  },
});
