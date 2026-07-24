import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useToast } from '@/components/feedback/ToastProvider';
import { useTheme } from '@/hooks/useTheme';
import { useConnectDrive, useDisconnectDrive, useDriveStatus, useSelectDriveFolder } from './useDrive';
import { useStartSync } from './useSync';
import { FolderSelector } from './FolderSelector';
import { SyncPanel } from './SyncPanel';

export function DriveScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: drive, isLoading, isError, refetch } = useDriveStatus();
  const connectMutation = useConnectDrive();
  const disconnectMutation = useDisconnectDrive();
  const selectFolderMutation = useSelectDriveFolder();
  const startSync = useStartSync();
  const toast = useToast();
  const params = useLocalSearchParams<{ status?: string }>();

  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  // Handles landing back here after the Google OAuth redirect round trip
  // (backend redirects to `${frontendDriveCallbackUrl}?status=connected|failed`).
  const handledRedirectRef = useRef(false);
  useEffect(() => {
    if (handledRedirectRef.current || !params.status) return;
    handledRedirectRef.current = true;
    if (params.status === 'connected') {
      toast.show('Google Drive connected.', 'success');
      refetch();
    } else if (params.status === 'failed') {
      toast.show('Could not connect to Google Drive.', 'error');
    }
  }, [params.status, refetch, toast]);

  if (isLoading) return <LoadingIndicator />;
  if (isError || !drive) return <ErrorState onRetry={refetch} />;

  const connected = drive.state === 'CONNECTED';
  const hasFolder = !!drive.rootFolder;

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync();
    } catch {
      toast.show('Could not open Google sign-in.', 'error');
    }
  };

  const handleConfirmFolder = async (folder: Parameters<typeof selectFolderMutation.mutateAsync>[0]) => {
    try {
      await selectFolderMutation.mutateAsync(folder);
      toast.show(`Root folder set to "${folder.name}".`, 'success');
      setFolderPickerOpen(false);
    } catch {
      toast.show('Could not select that folder.', 'error');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      toast.show('Google Drive disconnected.', 'info');
    } finally {
      setDisconnectConfirmOpen(false);
    }
  };

  const handleSync = async () => {
    try {
      await startSync.mutateAsync();
    } catch {
      toast.show('Could not start synchronization.', 'error');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Sources"
        subtitle="Where Company Vault gets its knowledge. One Drive folder, synced on demand."
      />

      <View style={styles.grid}>
        <Card style={styles.panel}>
          <Text style={[typography.h3, { color: colors.text }]}>Google Drive</Text>
          <Text style={styles.panelSub}>
            {connected ? `Connected as ${drive.googleAccountEmail}` : 'Not connected yet'}
          </Text>

          <View style={styles.steps}>
            <Step
              index={1}
              done={connected}
              label="Connect your Google account"
              detail="Read-only access, handled entirely by the backend"
              styles={styles}
              colors={colors}
            />
            <Step
              index={2}
              done={hasFolder}
              label="Choose a folder"
              detail="Everything inside it becomes searchable"
              styles={styles}
              colors={colors}
            />
            <Step
              index={3}
              done={!!drive.lastSyncedAt}
              label="Sync"
              detail="Run it whenever documents change"
              styles={styles}
              colors={colors}
            />
          </View>

          {drive.state === 'FAILED' ? (
            <View style={styles.failedBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.danger} />
              <Text style={[typography.caption, { color: colors.danger, flexShrink: 1 }]}>
                The last connection attempt failed. Please try again.
              </Text>
            </View>
          ) : null}

          {!connected ? (
            <>
              <Button
                label="Connect Google Drive"
                icon="logo-google"
                onPress={handleConnect}
                loading={connectMutation.isPending}
                style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
              />
              <View style={styles.privacyNote}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textFaint} />
                <Text style={styles.privacyText}>
                  This app never receives your Google credentials or files directly.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.folderRow}>
                <View style={styles.folderIcon}>
                  <Ionicons name="folder" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[typography.captionMedium, { color: colors.text }]} numberOfLines={1}>
                    {drive.rootFolder?.name ?? 'No folder selected'}
                  </Text>
                  <Text style={[typography.tiny, { fontWeight: '400', color: colors.textFaint }]} numberOfLines={1}>
                    {hasFolder
                      ? `Root folder · ${drive.totalFilesDiscovered} files discovered`
                      : 'Choose the folder Vault should index'}
                  </Text>
                </View>
                <Button
                  label={hasFolder ? 'Change folder' : 'Select folder'}
                  variant="ghost"
                  size="sm"
                  onPress={() => setFolderPickerOpen(true)}
                />
              </View>
              <Button
                label="Disconnect Drive"
                variant="ghost"
                size="sm"
                icon="unlink-outline"
                onPress={() => setDisconnectConfirmOpen(true)}
                style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
              />
            </>
          )}
        </Card>

        <Card style={styles.panel}>
          <Text style={[typography.h3, { color: colors.text }]}>Synchronization</Text>
          <Text style={styles.panelSub}>Manual sync — new files are picked up, nothing is ever deleted</Text>

          <View style={styles.syncCta}>
            <Button
              label="Sync now"
              icon="refresh"
              onPress={handleSync}
              loading={startSync.isPending}
              disabled={!connected || !hasFolder}
            />
            {drive.lastSyncedAt ? (
              <View style={styles.syncStatus}>
                <View style={[styles.syncDot, { backgroundColor: colors.accent }]} />
                <Text style={[typography.caption, { color: colors.accent }]}>
                  Last synced {new Date(drive.lastSyncedAt).toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text style={[typography.caption, { color: colors.textFaint }]}>Never synced</Text>
            )}
          </View>

          <View style={styles.statsStrip}>
            <SyncStat value={drive.totalFilesDiscovered} label="Discovered" styles={styles} colors={colors} />
            <SyncStat value={drive.totalIndexed} label="Indexed" styles={styles} colors={colors} />
            <SyncStat
              value={drive.totalFailed}
              label="Failed"
              tone={drive.totalFailed > 0 ? colors.danger : undefined}
              styles={styles}
              colors={colors}
            />
          </View>

          {startSync.activeRunId ? (
            <View style={{ marginTop: spacing.md }}>
              <SyncPanel runId={startSync.activeRunId} />
            </View>
          ) : null}
        </Card>
      </View>

      <FolderSelector
        visible={folderPickerOpen}
        onCancel={() => setFolderPickerOpen(false)}
        onConfirm={handleConfirmFolder}
        confirming={selectFolderMutation.isPending}
      />

      <ConfirmDialog
        visible={disconnectConfirmOpen}
        title="Disconnect Google Drive?"
        description="Company Vault will stop syncing new documents until you reconnect. Already-indexed documents remain searchable."
        confirmLabel="Disconnect"
        destructive
        loading={disconnectMutation.isPending}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectConfirmOpen(false)}
      />
    </ScrollView>
  );
}

function Step({
  index,
  done,
  label,
  detail,
  styles,
  colors,
}: {
  index: number;
  done: boolean;
  label: string;
  detail: string;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepBadge, done && { backgroundColor: colors.accentSoft, borderColor: 'transparent' }]}>
        {done ? (
          <Ionicons name="checkmark" size={13} color={colors.accent} />
        ) : (
          <Text style={[typography.tiny, { color: colors.textFaint }]}>{index}</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.captionMedium, { color: done ? colors.text : colors.textMuted }]}>{label}</Text>
        <Text style={[typography.tiny, { fontWeight: '400', color: colors.textFaint }]}>{detail}</Text>
      </View>
    </View>
  );
}

function SyncStat({
  value,
  label,
  tone,
  styles,
  colors,
}: {
  value: number;
  label: string;
  tone?: string;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={[typography.h2, { color: tone ?? colors.text }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      paddingBottom: spacing.xxl,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'flex-start',
    },
    panel: {
      flex: 1,
      minWidth: 320,
    },
    panelSub: {
      ...typography.caption,
      color: colors.textFaint,
      marginTop: 2,
      marginBottom: spacing.sm,
    },
    steps: {
      gap: spacing.xs + 2,
      marginBottom: spacing.sm,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    failedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
    },
    privacyNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: spacing.sm,
    },
    privacyText: {
      ...typography.tiny,
      fontWeight: '400',
      color: colors.textFaint,
      flexShrink: 1,
    },
    folderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      marginTop: spacing.xs,
    },
    folderIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm + 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    syncCta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    syncStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    syncDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statsStrip: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    statCell: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm + 2,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    statLabel: {
      ...typography.tiny,
      color: colors.textFaint,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
  });
