import type { ChatRequest, ChatResponse } from '@/types/domain';
import { mockSendChatMessage } from '@/mocks/chatMock';

export const chatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return mockSendChatMessage(request);
  },
};
