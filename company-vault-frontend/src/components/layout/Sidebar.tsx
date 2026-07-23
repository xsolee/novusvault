import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { radius, shadow, spacing, typography, type ThemeColors } from '@/constants/theme';
import { NAV_GROUPS, NAV_ITEMS } from '@/constants/nav';
import { Logo } from '@/components/common/Logo';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useDriveStatus } from '@/features/drive/useDrive';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: drive } = useDriveStatus();

  const discovered = drive?.totalFilesDiscovered ?? 0;
  const indexed = drive?.totalIndexed ?? 0;
  const failed = drive?.totalFailed ?? 0;
  const healthPercent = discovered > 0 ? Math.round((indexed / discovered) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.workspace}>
        <Logo size={32} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.captionMedium, { color: colors.text }]} numberOfLines={1}>
            Company Vault
          </Text>
          <Text style={styles.workspaceSub} numberOfLines={1}>
            Knowledge admin
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/chat')}
        style={({ hovered, pressed }: any) => [
          styles.askCta,
          (hovered || pressed) && { backgroundColor: colors.primaryHover },
        ]}
      >
        <Ionicons name="sparkles" size={15} color={colors.textInverse} />
        <Text style={[typography.captionMedium, { color: colors.textInverse, flex: 1 }]}>Ask a question</Text>
        {Platform.OS === 'web' ? <Text style={styles.kbd}>⌘K</Text> : null}
      </Pressable>

      <View style={styles.nav}>
        {NAV_GROUPS.map((group) => (
          <View key={group.key}>
            <Text style={styles.navLabel}>{group.label}</Text>
            {NAV_ITEMS.filter((item) => item.group === group.key).map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href)}
                  style={({ hovered }: any) => [
                    styles.navItem,
                    active && styles.navItemActive,
                    hovered && !active && styles.navItemHover,
                  ]}
                >
                  {active ? <View style={styles.activeRail} /> : null}
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={18}
                    color={active ? colors.primaryText : colors.textMuted}
                  />
                  <Text
                    style={[typography.bodyMedium, { flex: 1 }, active ? styles.navLabelActive : styles.navLabelIdle]}
                  >
                    {item.label}
                  </Text>
                  {item.href === '/documents' && indexed > 0 ? (
                    <View style={[styles.countPill, active && { backgroundColor: colors.primarySoft }]}>
                      <Text style={[typography.tiny, { color: active ? colors.primaryText : colors.textFaint }]}>
                        {indexed}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/dashboard')}
        style={({ hovered }: any) => [styles.healthCard, hovered && { borderColor: colors.borderStrong }]}
      >
        <View style={styles.healthTop}>
          <Text style={[typography.captionMedium, { color: colors.text }]}>Index health</Text>
          <Text style={[typography.tiny, { color: colors.accent }]}>{healthPercent}%</Text>
        </View>
        <View style={styles.healthTrack}>
          <View style={[styles.healthFill, { width: `${healthPercent}%` }]} />
        </View>
        <View style={styles.healthBottom}>
          <Text style={styles.healthMeta}>
            {indexed} of {discovered} indexed
          </Text>
          {failed > 0 ? (
            <Text style={[typography.tiny, { color: colors.warning }]}>{failed} need attention</Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={signOut}
        style={({ hovered }: any) => [styles.userRow, hovered && { backgroundColor: colors.surface }]}
      >
        <Avatar name={admin?.name ?? 'Admin'} size={32} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.captionMedium, { color: colors.text }]} numberOfLines={1}>
            {admin?.name ?? 'Administrator'}
          </Text>
          <Text style={[typography.tiny, { color: colors.textFaint, fontWeight: '400' }]} numberOfLines={1}>
            {admin?.email}
          </Text>
        </View>
        <Ionicons name="log-out-outline" size={17} color={colors.textFaint} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: 248,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      backgroundColor: colors.sidebarBg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs + 2,
      height: '100%',
    },
    workspace: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      marginBottom: spacing.xs,
    },
    workspaceSub: {
      ...typography.tiny,
      color: colors.textFaint,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    askCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 1,
      backgroundColor: colors.primary,
      borderRadius: radius.md - 1,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      marginHorizontal: 2,
      marginBottom: spacing.sm,
      ...shadow.card,
    },
    kbd: {
      ...typography.tiny,
      color: colors.textInverse,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 5,
      paddingHorizontal: 6,
      paddingVertical: 1,
      overflow: 'hidden',
    },
    nav: {
      flex: 1,
      gap: spacing.xxs,
    },
    navLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textFaint,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxs,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm + 1,
      marginBottom: 2,
    },
    navItemHover: {
      backgroundColor: colors.surface,
    },
    navItemActive: {
      backgroundColor: colors.surface,
      ...shadow.card,
    },
    activeRail: {
      position: 'absolute',
      left: -(spacing.xs + 2),
      top: 7,
      bottom: 7,
      width: 3,
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
      backgroundColor: colors.primary,
    },
    navLabelIdle: {
      color: colors.textMuted,
    },
    navLabelActive: {
      color: colors.primaryText,
    },
    countPill: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.pill,
      paddingHorizontal: 7,
      paddingVertical: 1,
    },
    healthCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginHorizontal: 2,
      marginBottom: spacing.xs,
      ...shadow.card,
    },
    healthTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    healthTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.surfaceMuted,
      overflow: 'hidden',
      marginBottom: 7,
    },
    healthFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    healthBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    healthMeta: {
      ...typography.tiny,
      color: colors.textFaint,
      fontWeight: '400',
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 1,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
      marginHorizontal: 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
  });
