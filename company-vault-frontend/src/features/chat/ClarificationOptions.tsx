import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { DepartmentBadge } from '@/components/common/Badge';
import type { ClarificationSuggestion } from '@/types/domain';

export function ClarificationOptions({
  suggestions,
  onSelect,
}: {
  suggestions: ClarificationSuggestion[];
  onSelect: (suggestion: ClarificationSuggestion) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.list}>
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion.label}
          onPress={() => onSelect(suggestion)}
          style={({ hovered }: any) => [styles.option, hovered && styles.optionHover]}
        >
          <Text style={[typography.captionMedium, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {suggestion.label}
          </Text>
          <DepartmentBadge department={suggestion.department} />
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radius.sm + 2,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm + 2,
    },
    optionHover: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
  });
