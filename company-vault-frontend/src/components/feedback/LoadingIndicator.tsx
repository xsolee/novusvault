import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function LoadingIndicator({ inline = false }: { inline?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={[inline ? styles.inline : styles.container, !inline && { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  inline: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
