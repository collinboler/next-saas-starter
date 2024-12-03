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
  const [searchQuery, setSearchQuery] = useState('');

  const createNewChat = () => {
    setActiveConversation(null);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen w-72 shrink-0 bg-card transition-all duration-200 ease-in-out border-r border-border',
          sidebarOpen ? 'translate-x-0 mr-0' : '-translate-x-72 mr-[-288px]'
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
              className="pl-8 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-foreground hover:bg-muted',
                    activeConversation === conv.id && 'bg-muted'
                  )}
                  onClick={() => setActiveConversation(conv.id)}
                >
                  {conv.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col transition-all duration-200 ease-in-out',
        sidebarOpen ? 'ml-0' : 'ml-0'
      )}>
        <header className="h-14 border-b bg-background px-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 overflow-hidden">
          <div className="max-w-3xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
