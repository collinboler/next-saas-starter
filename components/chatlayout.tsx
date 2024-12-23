// app/components/ChatLayout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Plus, Search, MoreHorizontal, Trash, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Conversation } from 'app/types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogPortal,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingChat, setDeletingChat] = useState<Conversation | null>(null);

  const createNewChat = () => {
    setActiveConversation(null);
  };

  const deleteConversation = (id: string) => {
    setConversations((prevConversations) =>
      prevConversations.filter((conv) => conv.id !== id)
    );
    if (activeConversation === id) {
      setActiveConversation(null);
    }
  };

  const handleDeleteClick = (conv: Conversation) => {
    setDeletingChat(conv);
  };

  const handleDeleteConfirm = () => {
    if (deletingChat) {
      deleteConversation(deletingChat.id);
    }
    setDeletingChat(null);
  };

  const handleDeleteCancel = () => {
    setDeletingChat(null);
  };

  const renameConversation = (id: string, newName: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === id ? { ...conv, name: newName } : conv
      )
    );
    setEditingId(null);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] bg-background overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'h-[calc(100vh-8rem)] w-72 shrink-0 transition-all duration-200 ease-in-out border-r border-border',
            'dark:bg-zinc-900 bg-zinc-50',
            isSidebarOpen ? 'translate-x-0 mr-0' : '-translate-x-72 mr-[-288px]'
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
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex items-center rounded',
                      activeConversation === conv.id ? 'bg-muted' : 'hover:bg-muted'
                    )}
                  >
                    {editingId === conv.id ? (
                      <Input
                        className="flex-1 mr-2"
                        defaultValue={conv.name}
                        onBlur={(e) => renameConversation(conv.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameConversation(conv.id, e.currentTarget.value);
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start text-foreground"
                        onClick={() => setActiveConversation(conv.id)}
                      >
                        {conv.name}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingId(conv.id)}
                          className="cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(conv)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn(
          'flex-1 flex flex-col transition-all duration-200 ease-in-out',
          isSidebarOpen ? 'ml-0' : 'ml-0'
        )}>
          <header className="h-14 border-b bg-background px-4 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
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

      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center", 
          !deletingChat && "pointer-events-none opacity-0"
        )}
      >
        <div 
          className="absolute inset-0 bg-black/50 cursor-pointer" 
          onClick={() => setDeletingChat(null)}
        />
        <div className="relative z-50 w-full max-w-lg p-4">
          <div className="rounded-lg bg-background">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Delete chat?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This will delete {deletingChat?.name}.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
