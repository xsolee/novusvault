import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { sectionTitleFor } from '@/constants/nav';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useDriveStatus } from '@/features/drive/useDrive';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { admin } = useAuth();
  const { colors, scheme, toggleScheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: drive } = useDriveStatus();

  // Global ⌘K / Ctrl+K jumps to Ask from anywhere (web only).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/chat');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [router]);

  const connected = drive?.state === 'CONNECTED';
  const syncLabel = connected
    ? drive?.lastSyncedAt
      ? `Synced ${formatRelative(drive.lastSyncedAt)}`
      : 'Never synced'
    : 'Not connected';

  return (
    <View style={styles.container}>
      <View style={styles.crumb}>
        <Text style={styles.crumbRoot}>Company Vault</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.textFaint} />
        <Text style={styles.crumbCurrent}>{sectionTitleFor(pathname)}</Text>
      </View>

      <Pressable
        onPress={() => router.push('/chat')}
        style={({ hovered }: any) => [styles.search, hovered && styles.searchHover]}
      >
        <Ionicons name="search" size={14} color={colors.textFaint} />
        <Text style={styles.searchText} numberOfLines={1}>
          Search documents or ask a question…
        </Text>
        {Platform.OS === 'web' ? <Text style={styles.kbd}>⌘K</Text> : null}
      </Pressable>

      <View style={styles.right}>
        <Pressable
          onPress={() => router.push('/drive')}
          style={[styles.syncChip, { backgroundColor: connected ? colors.accentSoft : colors.surfaceMuted }]}
        >
          <View style={[styles.syncDot, { backgroundColor: connected ? colors.accent : colors.textFaint }]} />
          <Text style={[typography.tiny, { color: connected ? colors.accent : colors.textMuted }]}>{syncLabel}</Text>
        </Pressable>

        <Pressable
          onPress={toggleScheme}
          accessibilityRole="button"
          accessibilityLabel="Switch theme"
          style={({ hovered }: any) => [styles.iconBtn, hovered && styles.iconBtnHover]}
        >
          <Ionicons name={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={17} color={colors.textMuted} />
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={({ hovered }: any) => [styles.userBtn, hovered && styles.iconBtnHover]}
        >
          <Avatar name={admin?.name ?? 'Admin'} size={28} />
          <Ionicons name="chevron-down" size={13} color={colors.textFaint} />
        </Pressable>
      </View>
    </View>
  );
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      height: 56,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    crumb: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    crumbRoot: {
      ...typography.caption,
      color: colors.textFaint,
    },
    crumbCurrent: {
      ...typography.captionMedium,
      color: colors.text,
    },
    search: {
      flex: 1,
      maxWidth: 420,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 1,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md - 2,
      paddingVertical: 7,
      paddingHorizontal: spacing.sm,
    },
    searchHover: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
    },
    searchText: {
      ...typography.caption,
      color: colors.textFaint,
      flex: 1,
    },
    kbd: {
      ...typography.tiny,
      color: colors.textMuted,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      paddingHorizontal: 6,
      paddingVertical: 1,
      overflow: 'hidden',
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginLeft: 'auto',
    },
    syncChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: radius.pill,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm - 1,
    },
    syncDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.sm + 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnHover: {
      backgroundColor: colors.surfaceMuted,
    },
    divider: {
      width: 1,
      height: 22,
      backgroundColor: colors.border,
      marginHorizontal: 2,
    },
    userBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 3,
      paddingLeft: 3,
      paddingRight: 6,
      borderRadius: radius.pill,
    },
  });
