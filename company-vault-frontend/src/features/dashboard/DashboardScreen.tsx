import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { DepartmentBadge } from '@/components/common/Badge';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { useDriveStatus } from '@/features/drive/useDrive';
import { useDocuments } from '@/features/documents/useDocuments';
import { DocumentRow } from '@/features/documents/DocumentRow';
import { StatCard } from './StatCard';
import { mockDepartmentBreakdown, mockSuggestedQuestions } from '@/mocks/fixtures';

export function DashboardScreen() {
  const router = useRouter();
  const { data: drive, isLoading: driveLoading } = useDriveStatus();
  const { data: documentPage, isLoading: docsLoading } = useDocuments({ page: 1, pageSize: 6 });

  const recentIndexed = (documentPage?.items ?? []).filter((d) => d.status === 'INDEXED').slice(0, 5);
  const processingCount = (documentPage?.items ?? []).filter((d) => d.status === 'PROCESSING').length;

  if (driveLoading || docsLoading) return <LoadingIndicator />;

  const connected = drive?.state === 'CONNECTED';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader title="Dashboard" subtitle="An overview of your connected company knowledge base." />

      <View style={styles.statsGrid}>
        <StatCard
          icon={connected ? 'checkmark-circle' : 'close-circle'}
          iconColor={connected ? colors.accent : colors.textFaint}
          iconBg={connected ? colors.accentSoft : colors.surfaceMuted}
          label="Drive connection"
          value={connected ? 'Connected' : 'Not connected'}
        />
        <StatCard
          icon="folder-outline"
          label="Selected folder"
          value={drive?.rootFolder?.name ?? '—'}
        />
        <StatCard
          icon="time-outline"
          label="Last synchronization"
          value={drive?.lastSyncedAt ? formatRelative(drive.lastSyncedAt) : 'Never'}
        />
        <StatCard icon="documents-outline" label="Files discovered" value={String(drive?.totalFilesDiscovered ?? 0)} />
        <StatCard
          icon="checkmark-done-outline"
          iconColor={colors.accent}
          iconBg={colors.accentSoft}
          label="Indexed documents"
          value={String(drive?.totalIndexed ?? 0)}
        />
        <StatCard
          icon="sync-outline"
          iconColor={colors.info}
          iconBg={colors.infoSoft}
          label="Processing"
          value={String(processingCount)}
        />
        <StatCard
          icon="alert-circle-outline"
          iconColor={colors.danger}
          iconBg={colors.dangerSoft}
          label="Processing errors"
          value={String(drive?.totalFailed ?? 0)}
        />
      </View>

      <View style={styles.actionsRow}>
        <Button
          label={connected ? 'Sync Documents' : 'Connect Google Drive'}
          icon={connected ? 'refresh' : 'cloud-upload-outline'}
          onPress={() => router.push('/drive')}
        />
        <Button label="Select Folder" variant="secondary" icon="folder-open-outline" onPress={() => router.push('/drive')} />
        <Button label="Ask Company Vault" variant="secondary" icon="sparkles-outline" onPress={() => router.push('/chat')} />
      </View>

      <View style={styles.twoColumn}>
        <Card style={styles.column} padded={false}>
          <View style={styles.cardHeader}>
            <Text style={typography.h3}>Recently indexed</Text>
            <Button label="View all" variant="ghost" size="sm" onPress={() => router.push('/documents')} />
          </View>
          {recentIndexed.length === 0 ? (
            <Text style={styles.emptyText}>No documents indexed yet.</Text>
          ) : (
            <View style={{ paddingHorizontal: spacing.xs, paddingBottom: spacing.sm }}>
              {recentIndexed.map((doc) => (
                <DocumentRow key={doc.id} document={doc} onPress={() => router.push(`/documents/${doc.id}`)} />
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.column} padded={false}>
          <View style={styles.cardHeader}>
            <Text style={typography.h3}>By department</Text>
          </View>
          <View style={styles.departmentList}>
            {mockDepartmentBreakdown.map((entry) => (
              <View key={entry.department} style={styles.departmentRow}>
                <DepartmentBadge department={entry.department} />
                <Text style={styles.departmentCount}>{entry.count}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <Card style={{ marginTop: spacing.md }} padded={false}>
        <View style={styles.cardHeader}>
          <Text style={typography.h3}>Recent questions</Text>
          <Button label="Ask something" variant="ghost" size="sm" onPress={() => router.push('/chat')} />
        </View>
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.xs }}>
          {mockSuggestedQuestions.slice(0, 3).map((q) => (
            <Text key={q} style={styles.questionText}>
              “{q}”
            </Text>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  twoColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  column: {
    flex: 1,
    minWidth: 320,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textFaint,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  departmentList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  departmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  departmentCount: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  questionText: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
