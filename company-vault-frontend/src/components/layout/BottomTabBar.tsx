import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '@/constants/theme';
import { NAV_ITEMS } from '@/constants/nav';
import { useTheme } from '@/hooks/useTheme';

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Pressable key={item.href} onPress={() => router.push(item.href)} style={styles.tab}>
            <Ionicons name={active ? item.activeIcon : item.icon} size={22} color={active ? colors.primary : colors.textFaint} />
            <Text
              style={[typography.tiny, { color: active ? colors.primary : colors.textFaint, marginTop: 2 }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
});
