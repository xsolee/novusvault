import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed, hovered }: any) => [
        styles.base,
        variantStyles[variant],
        size === 'sm' && styles.sm,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        hovered && !isDisabled && webHoverStyles[variant],
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? colors.textInverse : colors.primary} />
        ) : (
          <>
            {icon ? (
              <Ionicons
                name={icon}
                size={size === 'sm' ? 15 : 17}
                color={textStyles[variant].color as string}
                style={{ marginRight: spacing.xxs }}
              />
            ) : null}
            <Text style={[typography.bodyMedium, textStyles[variant], size === 'sm' && { fontSize: 13 }]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.dangerSoft },
});

const textStyles = StyleSheet.create({
  primary: { color: colors.textInverse },
  secondary: { color: colors.text },
  ghost: { color: colors.primaryText },
  danger: { color: colors.danger },
});

const webHoverStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primaryHover },
  secondary: { backgroundColor: colors.surfaceMuted },
  ghost: { backgroundColor: colors.surfaceMuted },
  danger: { backgroundColor: '#F9DADA' },
};
