import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { IconButton } from '@/components/common/IconButton';
import { DepartmentBadge } from '@/components/common/Badge';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ChatMessage } from '@/types/domain';
import { CitationCard } from './CitationCard';

export function ChatDetailsPanel({ latestAnswer, onClose }: { latestAnswer: ChatMessage | null; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const response = latestAnswer?.response;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="information-circle-outline" size={17} color={colors.text} />
          <Text style={[typography.h3, { color: colors.text }]}>Details</Text>
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
            <Section label="Detected department" styles={styles}>
              {response.detectedDepartment ? (
                <DepartmentBadge department={response.detectedDepartment} />
              ) : (
                <Text style={[typography.body, { color: colors.textFaint }]}>Not detected</Text>
              )}
            </Section>

            {response.detectedTopic ? (
              <Section label="Detected topic" styles={styles}>
                <Text style={[typography.body, { color: colors.text }]}>{response.detectedTopic}</Text>
              </Section>
            ) : null}

            <Section label="Response type" styles={styles}>
              <Text style={[typography.body, { color: colors.text }]}>{formatType(response.type)}</Text>
            </Section>

            {response.citations && response.citations.length > 0 ? (
              <Section label={`Citations (${response.citations.length})`} styles={styles}>
                <View style={{ gap: spacing.xs }}>
                  {response.citations.map((citation, i) => (
                    <CitationCard
                      key={`${citation.documentId}-${citation.pageNumber ?? 0}`}
                      citation={citation}
                      index={i + 1}
                    />
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

function Section({
  label,
  children,
  styles,
}: {
  label: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });
