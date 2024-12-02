// types/chat.ts
export type Message = {
    role: 'user' | 'assistant';
    content: string;
  };
  
  export type Conversation = {
    id: string;
    name: string;
    messages: Message[];
  };
  
  