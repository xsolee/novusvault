import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  right: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
