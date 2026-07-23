import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function Composer({ onSend, sending }: { onSend: (text: string) => void; sending: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <View style={[styles.container, shadow.card, focused && { borderColor: colors.primary }]}>
      <TextInput
        value={value}
        onChangeText={setValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Ask a question about your company documents…"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        multiline
        onKeyPress={(e: any) => {
          if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <Pressable
        onPress={handleSend}
        disabled={sending || !value.trim()}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={[styles.sendButton, (sending || !value.trim()) && styles.sendButtonDisabled]}
      >
        {sending ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Ionicons name="arrow-up" size={17} color={colors.textInverse} />
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      borderRadius: radius.lg - 2,
      paddingVertical: 6,
      paddingLeft: spacing.md,
      paddingRight: 6,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      paddingVertical: spacing.xs,
      color: colors.text,
      fontSize: 15,
      outlineStyle: 'none' as any,
    },
    sendButton: {
      width: 38,
      height: 38,
      borderRadius: radius.md - 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });
