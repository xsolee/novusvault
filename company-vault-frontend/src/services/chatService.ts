import type { ChatRequest, ChatResponse } from '@/types/domain';
import { apiClient } from './apiClient';

export const chatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { data } = await apiClient.post<ChatResponse>('/chat', request);
    return data;
  },
};
