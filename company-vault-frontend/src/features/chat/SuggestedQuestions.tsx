import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useDriveStatus } from '@/features/drive/useDrive';
import { mockSuggestedQuestions } from '@/mocks/fixtures';

const CHIP_DEPARTMENTS = [
  'HUMAN_RESOURCES',
  'LEGAL',
  'ACCOUNTING',
  'TREASURY',
  'GENERAL',
  'PROCUREMENT',
] as const;

export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  const { colors, departmentColors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: drive } = useDriveStatus();

  const indexed = drive?.totalIndexed ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ask your company anything</Text>
      <Text style={styles.subtitle}>
        Answers come only from your indexed documents — every claim is cited.
      </Text>
      {indexed > 0 ? (
        <Text style={styles.scope}>
          Searching across <Text style={styles.scopeStrong}>{indexed} documents</Text>
        </Text>
      ) : null}

      <View style={styles.chips}>
        {mockSuggestedQuestions.map((question, index) => {
          const dept = CHIP_DEPARTMENTS[index % CHIP_DEPARTMENTS.length];
          const deptColor = departmentColors[dept] ?? departmentColors.UNKNOWN;
          return (
            <Pressable
              key={question}
              onPress={() => onSelect(question)}
              style={({ hovered }: any) => [styles.chip, hovered && styles.chipHover]}
            >
              <View style={[styles.chipDot, { backgroundColor: deptColor.fg }]} />
              <Text style={styles.chipText} numberOfLines={1}>
                {question}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    title: {
      ...typography.display,
      fontSize: 26,
      lineHeight: 34,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 460,
      marginTop: spacing.xxs,
    },
    scope: {
      ...typography.caption,
      color: colors.textFaint,
      marginTop: spacing.xs,
    },
    scopeStrong: {
      ...typography.captionMedium,
      color: colors.textMuted,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.lg,
      maxWidth: 620,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radius.pill,
      paddingVertical: 7,
      paddingHorizontal: spacing.sm + 1,
      maxWidth: '100%',
    },
    chipHover: {
      borderColor: colors.primary,
    },
    chipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    chipText: {
      ...typography.caption,
      color: colors.text,
      flexShrink: 1,
    },
  });
