import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/constants/theme';

export function Logo({ size = 32, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: size * 0.32 },
        ]}
      >
        <View style={[styles.markInner, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.12 }]} />
      </View>
      {showWordmark ? <Text style={[typography.h3, styles.wordmark]}>Company Vault</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markInner: {
    backgroundColor: colors.textInverse,
    opacity: 0.9,
  },
  wordmark: {
    color: colors.text,
  },
});
