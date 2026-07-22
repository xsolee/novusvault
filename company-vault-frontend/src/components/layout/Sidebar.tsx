import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { NAV_ITEMS } from '@/constants/nav';
import { Logo } from '@/components/common/Logo';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size={30} showWordmark />
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
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
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={19}
                color={active ? colors.primaryText : colors.textMuted}
              />
              <Text style={[typography.bodyMedium, active ? styles.navLabelActive : styles.navLabel]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={signOut} style={styles.footer}>
        <Avatar name={admin?.name ?? 'Admin'} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.captionMedium, { color: colors.text }]} numberOfLines={1}>
            {admin?.name ?? 'Administrator'}
          </Text>
          <Text style={[typography.caption, { color: colors.textFaint }]} numberOfLines={1}>
            {admin?.email}
          </Text>
        </View>
        <Ionicons name="log-out-outline" size={18} color={colors.textFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 248,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    height: '100%',
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  nav: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  navItemHover: {
    backgroundColor: colors.surfaceMuted,
  },
  navItemActive: {
    backgroundColor: colors.primarySoft,
  },
  navLabel: {
    color: colors.textMuted,
  },
  navLabelActive: {
    color: colors.primaryText,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
