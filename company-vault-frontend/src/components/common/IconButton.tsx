import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function IconButton({
  icon,
  onPress,
  size = 20,
  color,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed, hovered }: any) => [
        styles.button,
        (pressed || hovered) && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <Ionicons name={icon} size={size} color={color ?? colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
