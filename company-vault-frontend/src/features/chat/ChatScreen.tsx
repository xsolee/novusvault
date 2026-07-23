import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { IconButton } from '@/components/common/IconButton';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/useTheme';
import type { ClarificationSuggestion, DocumentDepartment } from '@/types/domain';
import { useChat } from './useChat';
import { SuggestedQuestions } from './SuggestedQuestions';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { ChatDetailsPanel } from './ChatDetailsPanel';

const COLUMN_MAX_WIDTH = 720;

export function ChatScreen() {
  const { messages, sending, sendMessage } = useChat();
  const { useSidebarNav } = useResponsive();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [panelOpen, setPanelOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const latestAnswer = [...messages].reverse().find((m) => m.role === 'assistant') ?? null;

  const handleSend = (text: string, context?: { department?: DocumentDepartment; topic?: string }) => {
    sendMessage(text, context);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleSelectClarification = (suggestion: ClarificationSuggestion) => {
    handleSend(suggestion.label, { department: suggestion.department, topic: suggestion.topic });
  };

  return (
    <View style={styles.root}>
      <View style={styles.chatColumn}>
        {useSidebarNav ? (
          <View style={styles.panelToggle}>
            <IconButton
              icon={panelOpen ? 'information-circle' : 'information-circle-outline'}
              accessibilityLabel="Toggle details panel"
              onPress={() => setPanelOpen((v) => !v)}
              color={panelOpen ? colors.primary : colors.textMuted}
            />
          </View>
        ) : null}

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <View style={styles.column}>
              {messages.length === 0 ? (
                <SuggestedQuestions onSelect={handleSend} />
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onSelectClarification={handleSelectClarification}
                    />
                  ))}
                  <View style={styles.grounding}>
                    <Ionicons name="shield-checkmark-outline" size={13} color={colors.accent} />
                    <Text style={styles.groundingText}>
                      Answers are grounded in your documents. When something isn't indexed, Vault says so
                      instead of guessing.
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.composerWrap}>
            <View style={styles.column}>
              <Composer onSend={handleSend} sending={sending} />
              <Text style={styles.composerHint}>
                Vault answers only from indexed company documents · citations included with every answer
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {useSidebarNav && panelOpen ? (
        <ChatDetailsPanel latestAnswer={latestAnswer} onClose={() => setPanelOpen(false)} />
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.bg,
    },
    chatColumn: {
      flex: 1,
    },
    panelToggle: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 2,
    },
    messages: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      flexGrow: 1,
    },
    column: {
      width: '100%',
      maxWidth: COLUMN_MAX_WIDTH,
      alignSelf: 'center',
    },
    grounding: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingHorizontal: spacing.xxs,
      marginTop: spacing.xxs,
    },
    groundingText: {
      ...typography.tiny,
      fontWeight: '400',
      color: colors.textFaint,
      flexShrink: 1,
    },
    composerWrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    composerHint: {
      ...typography.tiny,
      fontWeight: '400',
      color: colors.textFaint,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
