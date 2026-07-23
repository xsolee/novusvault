import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  const textColor = {
    primary: colors.textInverse,
    secondary: colors.text,
    ghost: colors.primaryText,
    danger: colors.danger,
  }[variant];

  const hoverBg: Record<Variant, string> = {
    primary: colors.primaryHover,
    secondary: colors.surfaceMuted,
    ghost: colors.surfaceMuted,
    danger: colors.dangerSoft,
  };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed, hovered }: any) => [
        styles.base,
        styles[variant],
        size === 'sm' && styles.sm,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        hovered && !isDisabled && { backgroundColor: hoverBg[variant] },
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
                color={textColor}
                style={{ marginRight: spacing.xxs }}
              />
            ) : null}
            <Text style={[typography.bodyMedium, { color: textColor }, size === 'sm' && { fontSize: 13 }]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.md,
      paddingVertical: 11,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.dangerSoft },
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
