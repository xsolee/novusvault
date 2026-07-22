import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { IconButton } from '@/components/common/IconButton';
import { useResponsive } from '@/hooks/useResponsive';
import type { ClarificationSuggestion, DocumentDepartment } from '@/types/domain';
import { useChat } from './useChat';
import { SuggestedQuestions } from './SuggestedQuestions';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { ChatDetailsPanel } from './ChatDetailsPanel';

export function ChatScreen() {
  const { messages, sending, sendMessage } = useChat();
  const { useSidebarNav } = useResponsive();
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
        <View style={styles.header}>
          <View>
            <Text style={typography.h2}>Ask Company Vault</Text>
            <Text style={styles.headerSubtitle}>Answers are grounded in your indexed documents, with citations.</Text>
          </View>
          {useSidebarNav ? (
            <IconButton
              icon={panelOpen ? 'information-circle' : 'information-circle-outline'}
              accessibilityLabel="Toggle details panel"
              onPress={() => setPanelOpen((v) => !v)}
              color={panelOpen ? colors.primary : colors.textMuted}
            />
          ) : null}
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <SuggestedQuestions onSelect={handleSend} />
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} onSelectClarification={handleSelectClarification} />
              ))
            )}
          </ScrollView>

          <View style={styles.composerWrap}>
            <Composer onSend={handleSend} sending={sending} />
          </View>
        </KeyboardAvoidingView>
      </View>

      {useSidebarNav && panelOpen ? (
        <ChatDetailsPanel latestAnswer={latestAnswer} onClose={() => setPanelOpen(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },
  chatColumn: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
  },
  messages: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  composerWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
});
