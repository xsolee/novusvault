import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function Logo({ size = 32, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: size * 0.12,
            backgroundColor: colors.textInverse,
            opacity: 0.9,
          }}
        />
      </View>
      {showWordmark ? <Text style={[typography.h3, { color: colors.text }]}>Company Vault</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
