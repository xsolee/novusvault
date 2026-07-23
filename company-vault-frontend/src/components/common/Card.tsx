import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, shadow, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadow.card,
        },
        padded && { padding: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}
