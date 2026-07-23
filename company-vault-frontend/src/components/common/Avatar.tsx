import React from 'react';
import { Text, View } from 'react-native';
import { typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[typography.captionMedium, { color: colors.primaryText, fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}
