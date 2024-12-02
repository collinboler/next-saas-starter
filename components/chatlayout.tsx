// app/components/ChatLayout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Plus, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Conversation } from 'app/types/chat';

interface ChatLayoutProps {
  children: React.ReactNode;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConversation: string | null;
  setActiveConversation: React.Dispatch<React.SetStateAction<string | null>>;
}

export function ChatLayout({
  children,
  conversations,
  setConversations,
  activeConversation,
  setActiveConversation,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const createNewChat = () => {
    setActiveConversation(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 z-40 h-screen w-72 transform bg-gray-900 transition-transform duration-200 ease-in-out dark',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col p-4">
          <Button
            onClick={createNewChat}
            className="w-full justify-start space-x-2 mb-4"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>

          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-8 bg-gray-800 border-gray-700"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    activeConversation === conv.id && 'bg-gray-800'
                  )}
                  onClick={() => setActiveConversation(conv.id)}
                >
                  {conv.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 transition-margin duration-200 ease-in-out',
          sidebarOpen ? 'ml-72' : 'ml-0'
        )}
      >
        <header className="fixed top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="pt-14">{children}</main>
      </div>
    </div>
  );
}
