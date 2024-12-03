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

  const deleteConversation = (id: string) => {
    setConversations((prevConversations) =>
      prevConversations.filter((conv) => conv.id !== id)
    );
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
                <div key={conv.id} className="group flex items-center">
                  <Button
                    variant="ghost"
                    className={cn(
                      'flex-1 justify-start text-foreground hover:bg-muted',
                      activeConversation === conv.id && 'bg-muted'
                    )}
                    onClick={() => setActiveConversation(conv.id)}
                  >
                    {conv.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteConversation(conv.id)}
                  >
                    <span className="sr-only">Delete</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4 text-red-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </Button>
                </div>
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
