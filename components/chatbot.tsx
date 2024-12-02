// app/components/ChatBot.tsx
'use client';

import React from 'react';
import { Paperclip, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message, Conversation } from 'app/types/chat';

interface ChatBotProps {
  activeConversation: string | null;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setActiveConversation: React.Dispatch<React.SetStateAction<string | null>>;
}

const suggestions = [
  'Tell me a joke',
  'Explain quantum computing',
  'Write a haiku about coding',
  'Describe the taste of colors',
];

export const ChatBot = ({ activeConversation, conversations, setConversations, setActiveConversation }: ChatBotProps) => {
  // Add return statement
  return (
    <div>
      {/* Your ChatBot JSX here */}
    </div>
  );
};
