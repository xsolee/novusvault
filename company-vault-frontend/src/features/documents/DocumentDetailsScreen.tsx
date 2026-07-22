import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { DepartmentBadge, StatusBadge, formatEnumLabel } from '@/components/common/Badge';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/ToastProvider';
import { useDocumentDetails, useReprocessDocument } from './useDocuments';

export function DocumentDetailsScreen({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: doc, isLoading, isError, refetch } = useDocumentDetails(id);
  const reprocess = useReprocessDocument();
  const [contentSearch, setContentSearch] = useState('');

  const matchCount = useMemo(() => {
    if (!contentSearch || !doc) return 0;
    return doc.extractedText.toLowerCase().split(contentSearch.toLowerCase()).length - 1;
  }, [contentSearch, doc]);

  if (isLoading) return <LoadingIndicator />;
  if (isError || !doc) return <ErrorState onRetry={refetch} />;

  const handleReprocess = async () => {
    try {
      await reprocess.mutateAsync(id);
      toast.show('Document queued for reprocessing.', 'success');
    } catch {
      toast.show('Could not reprocess this document.', 'error');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader
        title={doc.filename}
        subtitle={doc.folderPath}
        right={
          <>
            <Button label="Back" variant="secondary" icon="arrow-back" size="sm" onPress={() => router.back()} />
            {doc.status === 'FAILED' ? (
              <Button label="Reprocess" icon="refresh" size="sm" loading={reprocess.isPending} onPress={handleReprocess} />
            ) : null}
          </>
        }
      />

      <View style={styles.body}>
        <Card>
          <Text style={typography.h3}>Overview</Text>
          <View style={styles.overviewGrid}>
            <Field label="Source" value="Google Drive" />
            <Field label="Folder" value={doc.folderPath} />
            <Field label="MIME type" value={doc.mimeType} />
            <Field label="Indexed date" value={doc.indexedAt ? new Date(doc.indexedAt).toLocaleString() : '—'} />
          </View>
          <View style={styles.badgeRow}>
            <DepartmentBadge department={doc.department} />
            <StatusBadge status={doc.status} />
          </View>
          {doc.driveLink ? (
            <View style={styles.driveLinkRow}>
              <Ionicons name="link-outline" size={14} color={colors.primaryText} />
              <Text style={styles.driveLinkText} numberOfLines={1}>
                {doc.driveLink}
              </Text>
            </View>
          ) : null}
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>AI-generated metadata</Text>
          <View style={styles.overviewGrid}>
            <Field label="Title" value={doc.metadata.title} />
            <Field label="Category" value={formatEnumLabel(doc.metadata.category)} />
          </View>
          <Field label="Summary" value={doc.metadata.summary} block />
          <TagList label="Main topics" items={doc.metadata.topics} />
          <TagList label="Important dates" items={doc.metadata.importantDates} />
          <TagList label="People mentioned" items={doc.metadata.people} />
          <TagList label="Companies mentioned" items={doc.metadata.companies} />
        </Card>

        <Card style={{ marginTop: spacing.md }} padded={false}>
          <View style={styles.extractedHeader}>
            <Text style={typography.h3}>Extracted content</Text>
            <View style={styles.contentSearchBox}>
              <Ionicons name="search" size={14} color={colors.textFaint} />
              <TextInput
                value={contentSearch}
                onChangeText={setContentSearch}
                placeholder="Search within text…"
                placeholderTextColor={colors.textFaint}
                style={styles.contentSearchInput}
              />
              {contentSearch ? <Text style={styles.matchCount}>{matchCount} match{matchCount === 1 ? '' : 'es'}</Text> : null}
            </View>
          </View>
          <View style={styles.extractedTextBox}>
            <Text style={styles.extractedText}>{doc.extractedText}</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

function Field({ label, value, block = false }: { label: string; value: string; block?: boolean }) {
  return (
    <View style={block ? styles.fieldBlock : styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.tagRow}>
        {items.map((item) => (
          <View key={item} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  field: {
    minWidth: 140,
  },
  fieldBlock: {
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  fieldValue: {
    ...typography.bodyMedium,
    color: colors.text,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  driveLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  driveLinkText: {
    ...typography.caption,
    color: colors.primaryText,
    flexShrink: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  tagText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  extractedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  contentSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  contentSearchInput: {
    ...typography.caption,
    color: colors.text,
    minWidth: 140,
    outlineStyle: 'none' as any,
  },
  matchCount: {
    ...typography.tiny,
    color: colors.textFaint,
  },
  extractedTextBox: {
    padding: spacing.md,
    paddingTop: 0,
  },
  extractedText: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
});
