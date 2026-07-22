import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useToast } from '@/components/feedback/ToastProvider';
import { useConnectDrive, useDisconnectDrive, useDriveStatus, useSelectDriveFolder } from './useDrive';
import { useStartSync } from './useSync';
import { FolderSelector } from './FolderSelector';
import { SyncPanel } from './SyncPanel';

export function DriveScreen() {
  const { data: drive, isLoading, isError, refetch } = useDriveStatus();
  const connectMutation = useConnectDrive();
  const disconnectMutation = useDisconnectDrive();
  const selectFolderMutation = useSelectDriveFolder();
  const startSync = useStartSync();
  const toast = useToast();

  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  if (isLoading) return <LoadingIndicator />;
  if (isError || !drive) return <ErrorState onRetry={refetch} />;

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync();
      toast.show('Google Drive connected.', 'success');
    } catch {
      toast.show('Could not connect to Google Drive.', 'error');
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
      <ScreenHeader title="Google Drive" subtitle="Manage the connection Company Vault uses as its document source." />

      <View style={styles.body}>
        {drive.state === 'NOT_CONNECTED' || drive.state === 'FAILED' ? (
          <Card style={styles.centeredCard}>
            {drive.state === 'FAILED' ? (
              <View style={styles.failedBanner}>
                <Ionicons name="warning-outline" size={16} color={colors.danger} />
                <Text style={styles.failedText}>The last connection attempt failed. Please try again.</Text>
              </View>
            ) : null}
            <View style={styles.cloudIcon}>
              <Ionicons name="cloud-outline" size={28} color={colors.primary} />
            </View>
            <Text style={typography.h2}>Connect your Google Drive</Text>
            <Text style={styles.explainer}>
              Company Vault uses a single Google Drive folder as its document source. Once connected,
              you'll choose one root folder to index — files in its subfolders are included automatically.
            </Text>
            <Button
              label="Connect Google Drive"
              icon="logo-google"
              onPress={handleConnect}
              loading={connectMutation.isPending}
              style={{ marginTop: spacing.md }}
            />
            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textFaint} />
              <Text style={styles.privacyText}>
                Document access is handled entirely by our backend — this app never receives your Google
                credentials or files directly.
              </Text>
            </View>
          </Card>
        ) : (
          <>
            <Card>
              <View style={styles.connectedHeader}>
                <View style={styles.connectedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                  <Text style={styles.connectedText}>Connected</Text>
                </View>
                <Text style={styles.accountEmail}>{drive.googleAccountEmail}</Text>
              </View>

              <View style={styles.infoGrid}>
                <InfoItem label="Root folder" value={drive.rootFolder?.name ?? 'Not selected'} />
                <InfoItem
                  label="Last synchronization"
                  value={drive.lastSyncedAt ? new Date(drive.lastSyncedAt).toLocaleString() : 'Never'}
                />
                <InfoItem label="Files discovered" value={String(drive.totalFilesDiscovered)} />
                <InfoItem label="Indexed" value={String(drive.totalIndexed)} />
                <InfoItem label="Failed" value={String(drive.totalFailed)} />
              </View>

              <View style={styles.actionsRow}>
                <Button label="Select Folder" variant="secondary" icon="folder-open-outline" onPress={() => setFolderPickerOpen(true)} />
                <Button
                  label="Sync Documents"
                  icon="refresh"
                  onPress={handleSync}
                  loading={startSync.isPending}
                  disabled={!drive.rootFolder}
                />
                <Button label="Disconnect" variant="danger" icon="unlink-outline" onPress={() => setDisconnectConfirmOpen(true)} />
              </View>
            </Card>

            {startSync.activeRunId ? (
              <View style={{ marginTop: spacing.md }}>
                <SyncPanel runId={startSync.activeRunId} />
              </View>
            ) : null}
          </>
        )}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
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
  centeredCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  cloudIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  explainer: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 420,
    marginTop: spacing.xs,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.lg,
    maxWidth: 420,
  },
  privacyText: {
    ...typography.caption,
    color: colors.textFaint,
    flexShrink: 1,
  },
  failedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    width: '100%',
  },
  failedText: {
    ...typography.caption,
    color: colors.danger,
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  connectedText: {
    ...typography.captionMedium,
    color: colors.accent,
  },
  accountEmail: {
    ...typography.caption,
    color: colors.textFaint,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  infoItem: {
    minWidth: 130,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.text,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
});
