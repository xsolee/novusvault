import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/common/Card';

export function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  hint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string;
  hint?: string;
}) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg ?? colors.primarySoft }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[typography.h1, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{label}</Text>
      {hint ? (
        <Text style={[typography.tiny, { fontWeight: '400', color: colors.textFaint, marginTop: spacing.xxs }]}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 180,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
