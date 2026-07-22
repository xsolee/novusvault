import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { DocumentCategory, DocumentDepartment, DocumentProcessingStatus } from '@/types/domain';
import { useDocuments } from './useDocuments';
import { DocumentFilters } from './DocumentFilters';
import { DocumentRow } from './DocumentRow';

const PAGE_SIZE = 8;

export function DocumentsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<DocumentDepartment | undefined>();
  const [category, setCategory] = useState<DocumentCategory | undefined>();
  const [status, setStatus] = useState<DocumentProcessingStatus | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useDocuments({
    search: search || undefined,
    department,
    category,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader title="Documents" subtitle="Every document Company Vault has discovered or indexed." />

      <View style={styles.layout}>
        <Card style={styles.filtersCard}>
          <DocumentFilters
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            department={department}
            onDepartmentChange={(v) => { setDepartment(v); setPage(1); }}
            category={category}
            onCategoryChange={(v) => { setCategory(v); setPage(1); }}
            status={status}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
          />
        </Card>

        <Card style={styles.listCard} padded={false}>
          {isLoading ? (
            <LoadingIndicator />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState icon="search-outline" title="No documents match" description="Try adjusting your filters or search term." />
          ) : (
            <>
              <View style={{ padding: spacing.xs }}>
                {data.items.map((doc) => (
                  <DocumentRow key={doc.id} document={doc} onPress={() => router.push(`/documents/${doc.id}`)} />
                ))}
              </View>
              <View style={styles.pagination}>
                <Text style={styles.pageInfo}>
                  Page {page} of {totalPages} · {data.total} document{data.total === 1 ? '' : 's'}
                </Text>
                <View style={styles.pageButtons}>
                  <Button label="Previous" variant="secondary" size="sm" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} />
                  <Button
                    label="Next"
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages || isFetching}
                    onPress={() => setPage((p) => p + 1)}
                  />
                </View>
              </View>
            </>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filtersCard: {
    width: 240,
  },
  listCard: {
    flex: 1,
    minWidth: 320,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pageInfo: {
    ...typography.caption,
    color: colors.textFaint,
  },
  pageButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
