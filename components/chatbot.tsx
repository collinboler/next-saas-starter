// app/components/ChatBot.tsx
'use client';

import React from 'react';
import { Paperclip, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message, Conversation, ChatMode } from 'app/types/chat';

interface ChatBotProps {
  activeConversation: string | null;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setActiveConversation: React.Dispatch<React.SetStateAction<string | null>>;
  selectedMode: ChatMode;
  setSelectedMode: React.Dispatch<React.SetStateAction<ChatMode>>;
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

const parseMarkdownFormatting = (text: string): React.ReactNode[] => {
  // First remove any text between 【】
  text = text.replace(/【[^】]*】/g, '');
  
  const parts: React.ReactNode[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '*') {
      // Handle bold (**) and italic (*)
      if (text[i + 1] === '*') {
        // Bold text
        if (currentText) {
          parts.push(currentText);
          currentText = '';
        }
        i += 2;
        let boldText = '';
        while (i < text.length && !(text[i] === '*' && text[i + 1] === '*')) {
          boldText += text[i];
          i++;
        }
        if (boldText) {
          parts.push(<strong key={`bold-${i}`}>{boldText}</strong>);
        }
        i += 2;
      } else {
        // Italic text
        if (currentText) {
          parts.push(currentText);
          currentText = '';
        }
        i++;
        let italicText = '';
        while (i < text.length && text[i] !== '*') {
          italicText += text[i];
          i++;
        }
        if (italicText) {
          parts.push(<em key={`italic-${i}`}>{italicText}</em>);
        }
        i++;
      }
    } else {
      currentText += text[i];
      i++;
    }
  }

  if (currentText) {
    parts.push(currentText);
  }

  return parts;
};

export function ChatBot({
  activeConversation,
  conversations,
  setConversations,
  setActiveConversation,
  selectedMode,
  setSelectedMode,
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
      const existingConversation = conversations.find(conv => conv.id === activeConversation);
      if (!existingConversation) {
        currentConversation = createNewChat(input);
      } else {
        currentConversation = { ...existingConversation };
      }
    }

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      timestamp: new Date().toISOString()
    };
    setInput('');

    // Update conversation with user message and empty assistant message
    const assistantMessage: Message = { 
      role: 'assistant', 
      content: '',
      timestamp: ''
    };
    currentConversation.messages.push(userMessage, assistantMessage);
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentConversation.id ? currentConversation : conv
      )
    );

    // Set loading immediately to show "Thinking..."
    setIsLoading(true);

    try {
      // Generate name from first user message in parallel
      if (currentConversation.messages.length === 2) {
        generateConversationName([userMessage]).then(name => {
          updateConversationName(currentConversation.id, name);
        });
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentConversation.messages.slice(0, -1), // Exclude empty assistant message
          threadId: currentConversation.threadId
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      // Get thread ID from response headers
      const threadId = response.headers.get('x-thread-id');
      if (threadId && !currentConversation.threadId) {
        setConversations(prev =>
          prev.map(conv =>
            conv.id === currentConversation.id
              ? { ...conv, threadId }
              : conv
          )
        );
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      console.log('Starting stream...');

      let firstChunkReceived = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Set the timestamp only when the response is complete
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === currentConversation.id
                  ? {
                      ...conv,
                      messages: conv.messages.map((msg, i) => 
                        i === conv.messages.length - 1 
                          ? { 
                              ...msg, 
                              timestamp: new Date().toISOString()
                            }
                          : msg
                      ),
                    }
                  : conv
              )
            );
            break;
          }

          const text = decoder.decode(value);
          if (!firstChunkReceived && text.length > 0) {
            setIsLoading(false);
            firstChunkReceived = true;
          }

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConversation.id
                ? {
                    ...conv,
                    messages: conv.messages.map((msg, i) => 
                      i === conv.messages.length - 1 
                        ? { 
                            ...msg, 
                            content: msg.content + text,
                          }
                        : msg
                    ),
                  }
                : conv
            )
          );
        }
      } catch (error) {
        console.error('Streaming error:', error);
      }
    } catch (error) {
      console.error('Error:', error);
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversation.id) {
            return {
              ...conv,
              messages: [
                ...conv.messages.slice(0, -1), // Remove the empty assistant message
                {
                  role: 'assistant',
                  content: 'Sorry, I encountered an error. Please try again.',
                  timestamp: new Date().toISOString()
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
      const response = await fetch('/api/chat-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Generate a very short (2-4 words) title for this chat based on the user message. Respond with ONLY the title, no explanation or quotes.'
            },
            messages[0], // Only use the first message
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate name');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let title = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        title += decoder.decode(value);
      }

      return title.trim() || 'New Chat';
    } catch (error) {
      console.error('Error generating name:', error);
      return 'New Chat';
    }
  };

  const createNewChat = (initialMessage: string) => {
    setSelectedMode(null);
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: 'New Chat',
      messages: [],
      threadId: undefined
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversation(null);
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

  const handleModeSelect = (mode: ChatMode) => {
    setSelectedMode(mode);
    if (mode === 'content_coach') {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        name: 'New Chat',
        messages: [],
        threadId: undefined
      };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversation(null);
    }
  };

  const currentConversation = activeConversation
    ? conversations.find((conv) => conv.id === activeConversation)
    : null;

  const getPlaceholderText = () => {
    switch (selectedMode) {
      case 'account_analysis':
        return "Message Account Analyzer...";
      case 'script_generator':
        return "Message Script Generator...";
      case 'content_coach':
        return "Message Content Coach...";
      default:
        return "Type a message...";
    }
  };

  // If no mode is selected, show the mode selection screen
  if (!selectedMode && !currentConversation) {
    return (
      <div className="flex h-[calc(100vh-12rem)] flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="mb-8 text-4xl font-bold">Choose Your Assistant</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              <div 
                onClick={() => handleModeSelect('account_analysis')}
                className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-all"
              >
                <h2 className="text-2xl font-semibold mb-2">Account Analysis</h2>
                <p className="text-muted-foreground">Analyze your TikTok account performance and get insights</p>
              </div>
              <div 
                onClick={() => handleModeSelect('script_generator')}
                className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-all"
              >
                <h2 className="text-2xl font-semibold mb-2">Script Generator</h2>
                <p className="text-muted-foreground">Generate engaging scripts for your TikTok videos</p>
              </div>
              <div 
                onClick={() => handleModeSelect('content_coach')}
                className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-all"
              >
                <h2 className="text-2xl font-semibold mb-2">Content Coach</h2>
                <p className="text-muted-foreground">Get personalized coaching and content strategy advice</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-muted-foreground mb-1 flex justify-between items-center">
                  <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
                  <span className="text-xs">
                    {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </p>
                <div className="text-sm space-y-4">
                  {message.role === 'assistant' && message.content === '' && isLoading ? (
                    <span>
                      Thinking<ThinkingDots />
                    </span>
                  ) : (
                    message.content.split('`\n`').map((paragraph, idx) => (
                      <p key={idx} className="whitespace-pre-wrap break-words leading-relaxed">
                        {parseMarkdownFormatting(paragraph)}
                      </p>
                    ))
                  )}
                </div>
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
            <h1 className="mb-8 text-4xl font-bold">
              {selectedMode === 'account_analysis' && "Account Analysis"}
              {selectedMode === 'script_generator' && "Script Generator"}
              {selectedMode === 'content_coach' && "What can I help with?"}
            </h1>
            <div className="w-full max-w-2xl">
              <div className="border rounded-lg bg-background">
                <form onSubmit={handleSubmit} className="flex space-x-2 p-4">
                  <Button type="button" variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={selectedMode === 'content_coach' ? "Message Content Coach..." : getPlaceholderText()}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading} className="shrink-0">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
              
              {selectedMode === 'content_coach' && (
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
              )}
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
                placeholder={selectedMode === 'content_coach' ? "Message Content Coach..." : getPlaceholderText()}
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
