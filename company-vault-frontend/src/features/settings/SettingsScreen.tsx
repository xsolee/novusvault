import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useToast } from '@/components/feedback/ToastProvider';
import { useAuth } from '@/hooks/useAuth';
import { useDisconnectDrive } from '@/features/drive/useDrive';
import { useSettings } from './useSettings';

export function SettingsScreen() {
  const { admin, signOut } = useAuth();
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const disconnectMutation = useDisconnectDrive();
  const toast = useToast();
  const router = useRouter();

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  if (isLoading) return <LoadingIndicator />;
  if (isError || !settings) return <ErrorState onRetry={refetch} />;

  const handleSignOut = async () => {
    await signOut();
    setSignOutConfirmOpen(false);
    router.replace('/login');
  };

  const handleDisconnect = async () => {
    await disconnectMutation.mutateAsync();
    toast.show('Google Drive disconnected.', 'info');
    setDisconnectConfirmOpen(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader title="Settings" subtitle="Manage your account and connection." />

      <View style={styles.body}>
        <Card>
          <View style={styles.profileRow}>
            <Avatar name={admin?.name ?? settings.displayName} size={48} />
            <View>
              <Text style={typography.h3}>{admin?.name ?? settings.displayName}</Text>
              <Text style={styles.mutedText}>{admin?.email}</Text>
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={typography.h3}>Connection</Text>
          <Row label="Connected Google account" value={settings.googleAccountEmail ?? 'Not connected'} />
          <Row label="Selected Drive folder" value={settings.driveFolderName ?? 'Not selected'} />
          <Row
            label="API connection status"
            value={settings.apiConnectionStatus === 'ONLINE' ? 'Online' : 'Offline'}
            valueColor={settings.apiConnectionStatus === 'ONLINE' ? colors.accent : colors.danger}
          />
          <View style={styles.actionsRow}>
            <Button
              label="Manage in Google Drive"
              variant="secondary"
              icon="cloud-outline"
              size="sm"
              onPress={() => router.push('/drive')}
            />
            {settings.googleAccountEmail ? (
              <Button
                label="Disconnect Google Drive"
                variant="danger"
                icon="unlink-outline"
                size="sm"
                onPress={() => setDisconnectConfirmOpen(true)}
              />
            ) : null}
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.signOutRow}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>Sign out</Text>
              <Text style={styles.mutedText}>You'll need to sign in with Google again to access Company Vault.</Text>
            </View>
            <Button label="Sign out" variant="secondary" icon="log-out-outline" onPress={() => setSignOutConfirmOpen(true)} />
          </View>
        </Card>
      </View>

      <ConfirmDialog
        visible={signOutConfirmOpen}
        title="Sign out of Company Vault?"
        confirmLabel="Sign out"
        destructive
        onConfirm={handleSignOut}
        onCancel={() => setSignOutConfirmOpen(false)}
      />

      <ConfirmDialog
        visible={disconnectConfirmOpen}
        title="Disconnect Google Drive?"
        description="Company Vault will stop syncing new documents until you reconnect."
        confirmLabel="Disconnect"
        destructive
        loading={disconnectMutation.isPending}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectConfirmOpen(false)}
      />
    </ScrollView>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  body: {
    paddingHorizontal: spacing.lg,
    maxWidth: 560,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  rowValue: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
