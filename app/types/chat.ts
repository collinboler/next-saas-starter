// types/chat.ts
export type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string; // ISO string timestamp
  };
  
  export type Conversation = {
    id: string;
    name: string;
    messages: Message[];
  };
  