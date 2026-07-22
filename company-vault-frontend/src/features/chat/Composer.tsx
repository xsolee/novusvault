import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '@/constants/theme';

export function Composer({ onSend, sending }: { onSend: (text: string) => void; sending: boolean }) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <View style={[styles.container, shadow.card]}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Ask about any company document…"
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
        {sending ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Ionicons name="send" size={16} color={colors.textInverse} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
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
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
