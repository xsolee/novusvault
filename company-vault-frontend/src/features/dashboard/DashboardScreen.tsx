import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { formatEnumLabel } from '@/components/common/Badge';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { useTheme } from '@/hooks/useTheme';
import { useDriveStatus } from '@/features/drive/useDrive';
import { useDocuments } from '@/features/documents/useDocuments';
import { StatCard } from './StatCard';
import { mockDepartmentBreakdown } from '@/mocks/fixtures';

export function DashboardScreen() {
  const router = useRouter();
  const { colors, departmentColors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: drive, isLoading: driveLoading } = useDriveStatus();
  const { data: documentPage, isLoading: docsLoading } = useDocuments({ page: 1, pageSize: 6 });

  if (driveLoading || docsLoading) return <LoadingIndicator />;

  const connected = drive?.state === 'CONNECTED';
  const indexed = drive?.totalIndexed ?? 0;
  const failed = drive?.totalFailed ?? 0;
  const pendingCount = (documentPage?.items ?? []).filter(
    (d) => d.status === 'PROCESSING' || d.status === 'PENDING',
  ).length;
  const needsAttention = failed + pendingCount;
  const maxCount = Math.max(...mockDepartmentBreakdown.map((d) => d.count), 1);
  const recentDocs = (documentPage?.items ?? []).slice(0, 5);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Overview"
        subtitle="The health of your knowledge base at a glance."
        right={<Button label="Ask Company Vault" icon="sparkles" onPress={() => router.push('/chat')} />}
      />

      <View style={styles.statsRow}>
        <StatCard
          icon="checkmark-done-outline"
          iconColor={colors.accent}
          iconBg={colors.accentSoft}
          label="Searchable documents"
          value={String(indexed)}
          hint={connected ? `From ${drive?.rootFolder?.name ?? 'your Drive folder'}` : 'Connect Drive to start'}
        />
        <StatCard
          icon="alert-circle-outline"
          iconColor={needsAttention > 0 ? colors.warning : colors.textFaint}
          iconBg={needsAttention > 0 ? colors.warningSoft : colors.surfaceMuted}
          label="Needs attention"
          value={String(needsAttention)}
          hint={needsAttention > 0 ? `${failed} failed · ${pendingCount} still processing` : 'All clear'}
        />
        <StatCard
          icon="time-outline"
          label="Last sync"
          value={drive?.lastSyncedAt ? formatRelative(drive.lastSyncedAt) : 'Never'}
          hint={`${drive?.totalFilesDiscovered ?? 0} files discovered`}
        />
      </View>

      <View style={styles.twoColumn}>
        <Card style={styles.coverageCard}>
          <Text style={[typography.h3, { color: colors.text }]}>Knowledge coverage</Text>
          <Text style={styles.cardSub}>
            Indexed documents by department — gaps here mean weaker answers there
          </Text>
          <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
            {mockDepartmentBreakdown.map((entry) => {
              const deptColor = departmentColors[entry.department] ?? departmentColors.UNKNOWN;
              return (
                <View key={entry.department} style={styles.barRow}>
                  <View style={styles.barName}>
                    <View style={[styles.barDot, { backgroundColor: deptColor.fg }]} />
                    <Text style={[typography.caption, { color: colors.text }]} numberOfLines={1}>
                      {formatEnumLabel(entry.department)}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(entry.count / maxCount) * 100}%`, backgroundColor: deptColor.fg },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{entry.count}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.activityCard}>
          <Text style={[typography.h3, { color: colors.text }]}>Recent activity</Text>
          <Text style={styles.cardSub}>Latest documents picked up by sync</Text>
          <View style={{ marginTop: spacing.xs }}>
            {recentDocs.length === 0 ? (
              <Text style={[typography.caption, { color: colors.textFaint, paddingVertical: spacing.sm }]}>
                Nothing yet — run a sync from Sources.
              </Text>
            ) : (
              recentDocs.map((doc) => (
                <View key={doc.id} style={styles.activityRow}>
                  <View
                    style={[
                      styles.activityDot,
                      {
                        backgroundColor:
                          doc.status === 'INDEXED'
                            ? colors.accent
                            : doc.status === 'FAILED'
                              ? colors.danger
                              : colors.info,
                      },
                    ]}
                  />
                  <Text style={[typography.caption, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {doc.filename}
                  </Text>
                  <Text style={styles.activityTime}>
                    {doc.indexedAt ? formatRelative(doc.indexedAt) : formatEnumLabel(doc.status)}
                  </Text>
                </View>
              ))
            )}
          </View>
          <Button
            label="Open Library"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/documents')}
            style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingBottom: spacing.xxl,
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    twoColumn: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
      alignItems: 'flex-start',
    },
    coverageCard: {
      flex: 3,
      minWidth: 320,
    },
    activityCard: {
      flex: 2,
      minWidth: 280,
    },
    cardSub: {
      ...typography.caption,
      color: colors.textFaint,
      marginTop: 2,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    barName: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      width: 150,
    },
    barDot: {
      width: 8,
      height: 8,
      borderRadius: 3,
    },
    barTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceMuted,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },
    barCount: {
      ...typography.captionMedium,
      color: colors.textMuted,
      width: 28,
      textAlign: 'right',
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    activityTime: {
      ...typography.tiny,
      fontWeight: '400',
      color: colors.textFaint,
    },
  });
