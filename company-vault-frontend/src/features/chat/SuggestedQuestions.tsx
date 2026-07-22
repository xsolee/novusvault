import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { Logo } from '@/components/common/Logo';
import { mockSuggestedQuestions } from '@/mocks/fixtures';

const CARD_ICONS: Array<{ icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = [
  { icon: 'people-outline', color: '#B4508B', bg: '#FBEAF3' },
  { icon: 'business-outline', color: '#5138C9', bg: '#EFECFD' },
  { icon: 'cash-outline', color: '#3D8FE8', bg: '#E7F1FD' },
  { icon: 'card-outline', color: '#2FA0A0', bg: '#E3F7F5' },
  { icon: 'document-text-outline', color: '#D97B3E', bg: '#FDF0E4' },
  { icon: 'briefcase-outline', color: '#8A6D3B', bg: '#F6EFE0' },
];

export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <View style={styles.container}>
      <Logo size={48} />
      <Text style={styles.title}>Welcome to Company Vault</Text>
      <Text style={styles.subtitle}>
        Ask a question about any indexed company document — HR, Finance, Legal, Procurement, and more.
      </Text>

      <View style={styles.grid}>
        {mockSuggestedQuestions.map((question, index) => {
          const style = CARD_ICONS[index % CARD_ICONS.length];
          return (
            <Pressable
              key={question}
              onPress={() => onSelect(question)}
              style={({ hovered }: any) => [styles.card, hovered && styles.cardHover]}
            >
              <View style={[styles.cardIcon, { backgroundColor: style.bg }]}>
                <Ionicons name={style.icon} size={17} color={style.color} />
              </View>
              <Text style={styles.cardText} numberOfLines={2}>
                {question}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 460,
    marginTop: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    maxWidth: 640,
  },
  card: {
    width: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  cardHover: {
    borderColor: colors.primary,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cardText: {
    ...typography.caption,
    color: colors.text,
  },
});
