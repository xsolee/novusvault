import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function LoadingIndicator({ inline = false }: { inline?: boolean }) {
  return (
    <View style={inline ? styles.inline : styles.container}>
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
