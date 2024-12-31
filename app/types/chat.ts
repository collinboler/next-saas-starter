// types/chat.ts
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  threadId?: string;
}

export type ChatMode = 'content_coach' | 'script_generator' | 'account_analysis' | null;
  