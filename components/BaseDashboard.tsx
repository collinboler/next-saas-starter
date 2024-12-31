// app/components/BaseDashboard.tsx
'use client';

import React from 'react';
import { ChatBot } from '@/components/chatbot';
import { ChatLayout } from './chatlayout';
import { Conversation, ChatMode } from 'app/types/chat';

export default function BaseDashboard() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<string | null>(null);
  const [selectedMode, setSelectedMode] = React.useState<ChatMode>(null);

  return (
    <ChatLayout
      conversations={conversations}
      setConversations={setConversations}
      activeConversation={activeConversation}
      setActiveConversation={setActiveConversation}
      selectedMode={selectedMode}
      setSelectedMode={setSelectedMode}
    >
      <ChatBot
        conversations={conversations}
        setConversations={setConversations}
        activeConversation={activeConversation}
        setActiveConversation={setActiveConversation}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
      />
    </ChatLayout>
  );
}
