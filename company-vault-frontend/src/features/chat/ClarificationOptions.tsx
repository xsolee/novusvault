import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import type { ClarificationSuggestion } from '@/types/domain';

export function ClarificationOptions({
  suggestions,
  onSelect,
}: {
  suggestions: ClarificationSuggestion[];
  onSelect: (suggestion: ClarificationSuggestion) => void;
}) {
  return (
    <View style={styles.list}>
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion.label}
          onPress={() => onSelect(suggestion)}
          style={({ hovered }: any) => [styles.option, hovered && styles.optionHover]}
        >
          <Text style={typography.bodyMedium}>{suggestion.label}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primaryText} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  optionHover: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
});
