import { useCallback, useState } from 'react';
import { chatService } from '@/services/chatService';
import type { ChatMessage, DocumentDepartment } from '@/types/domain';

let messageId = 0;
const nextId = () => `msg-${Date.now()}-${messageId++}`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(
    async (text: string, context?: { department?: DocumentDepartment; topic?: string }) => {
      const userMessage: ChatMessage = {
        id: nextId(),
        role: 'user',
        createdAt: new Date().toISOString(),
        text,
      };
      setMessages((prev) => [...prev, userMessage]);
      setSending(true);

      try {
        const response = await chatService.sendMessage({
          message: text,
          department: context?.department,
          topic: context?.topic,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            createdAt: new Date().toISOString(),
            text: response.message,
            response,
          },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            createdAt: new Date().toISOString(),
            text: 'Something went wrong answering that question. Please try again.',
            response: { type: 'error', message: 'Something went wrong answering that question.' },
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [],
  );

  return { messages, sending, sendMessage };
}
