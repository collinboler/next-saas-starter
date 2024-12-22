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

const initialSuggestions = [
  'Give me a viral video idea',
  'What topics are trending on TikTok?'
];

const moreSuggestions = [
  'Write me a blog post',
  'Generate a cool business idea',
  'Create a big workout plan',
];

const ThinkingDots = () => {
  return (
    <span className="inline-flex">
      <span className="animate-dot-1">.</span>
      <span className="animate-dot-2">.</span>
      <span className="animate-dot-3">.</span>
    </span>
  );
};

export function ChatBot({
  activeConversation,
  conversations,
  setConversations,
  setActiveConversation,
}: ChatBotProps) {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    let currentConversation: Conversation;
    if (!activeConversation) {
      currentConversation = createNewChat(input);
    } else {
      currentConversation =
        conversations.find((conv) => conv.id === activeConversation) ||
        createNewChat(input);
    }

    const userMessage: Message = { role: 'user', content: input };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversation.id) {
          return { ...conv, messages: [...conv.messages, userMessage] };
        }
        return conv;
      })
    );

    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                `This user's name is Collin. Please be friendly and helpful.`,
            },
            ...currentConversation.messages,
            userMessage,
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantMessage: Message = { role: 'assistant', content: '' };

      console.log('Starting stream...');

      // Add empty assistant message to conversation immediately
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversation.id
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
              }
            : conv
        )
      );

      let firstChunkReceived = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream complete. Final message:', assistantMessage);
            break;
          }

          const chunk = decoder.decode(value);
          if (!firstChunkReceived) {
            setIsLoading(false);
            firstChunkReceived = true;
          }

          assistantMessage = {
            role: 'assistant',
            content: assistantMessage.content + chunk
          };

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConversation.id
                ? {
                    ...conv,
                    messages: conv.messages.map((msg, i) => 
                      i === conv.messages.length - 1 ? assistantMessage : msg
                    ),
                  }
                : conv
            )
          );
        }
      } catch (error) {
        console.error('Streaming error:', error);
      }

      // Generate name after first exchange
      if (currentConversation.messages.length === 1) {
        generateConversationName([...currentConversation.messages, assistantMessage]).then((name) => {
          updateConversationName(currentConversation.id, name);
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversation.id) {
            return {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  role: 'assistant',
                  content: 'Sorry, I encountered an error. Please try again.',
                },
              ],
            };
          }
          return conv;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateConversationName = async (messages: Message[]) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: 'user',
              content:
                'Based on our conversation so far, suggest a very short (2-4 words) title for this chat. Respond with ONLY the title, no explanation or quotes.',
            },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate name');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let title = '';
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || '';
              title += content;
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }

      return title.trim() || 'New Chat';
    } catch (error) {
      console.error('Error generating name:', error);
      return 'New Chat';
    }
  };

  const createNewChat = (initialMessage: string) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: 'New Chat',
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversation(newConversation.id);
    return newConversation;
  };

  const updateConversationName = (id: string, name: string) => {
    setConversations((prevConversations) =>
      prevConversations.map((conv) => (conv.id === id ? { ...conv, name } : conv))
    );
  };

  const handleDeleteMessage = (index: number) => {
    if (!activeConversation) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversation) {
          const newMessages = [...conv.messages];
          newMessages.splice(index, 1);
          return { ...conv, messages: newMessages };
        }
        return conv;
      })
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const currentConversation = activeConversation
    ? conversations.find((conv) => conv.id === activeConversation)
    : null;

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {currentConversation ? (
          currentConversation.messages.map((message, index) => (
            <div key={index} className="mb-6 flex group">
              {message.role === 'user' ? (
                <Avatar className="h-8 w-8 mr-4">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-8 w-8 mr-4">
                  <AvatarImage src="/bot-avatar.png" alt="ChatBot" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteMessage(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="mb-8 text-4xl font-bold">What can I help with?</h1>
            <div className="w-full max-w-2xl">
              <div className="border rounded-lg bg-background">
                <form onSubmit={handleSubmit} className="flex space-x-2 p-4">
                  <Button type="button" variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message ChatGPT..."
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading} className="shrink-0">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
              
              <div className="mt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                    {initialSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="shrink-0 text-base"
                      >
                        {suggestion}
                      </Button>
                    ))}
                    {!showAllSuggestions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllSuggestions(true)}
                        className="shrink-0 text-base"
                      >
                        More
                      </Button>
                    )}
                  </div>
                  {showAllSuggestions && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {moreSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="shrink-0 text-base"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="mb-6 flex">
            <Avatar className="h-8 w-8 mr-4">
              <AvatarImage src="/bot-avatar.png" alt="ChatBot" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Assistant</p>
              <p className="text-sm">
                Thinking<ThinkingDots />
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {currentConversation && (
        <div className="p-4">
          <div className="border rounded-lg bg-background">
            <form onSubmit={handleSubmit} className="flex space-x-2 p-4">
              <Button type="button" variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message ChatGPT..."
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="shrink-0">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
