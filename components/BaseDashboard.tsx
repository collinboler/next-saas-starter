// app/components/BaseDashboard.tsx
'use client';

import React from 'react';
import { ChatBot } from '@/components/chatbot';
import { ChatLayout } from './chatlayout';
import { Conversation } from 'app/types/chat';

interface TrendsData {
  topics: string;
  hashtags: string;
  songs: string;
  creators: string;
  createdAt: string;
}

export default function BaseDashboard() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = React.useState<string | null>(null);
  const [trends, setTrends] = React.useState<TrendsData | null>(null);

  React.useEffect(() => {
    async function fetchTrends() {
      try {
        console.log('Fetching trends...');
        const response = await fetch('/api/trends', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();
        // Ensure we're getting string values
        const data = {
          topics: String(rawData.topics || ''),
          hashtags: String(rawData.hashtags || ''),
          songs: String(rawData.songs || ''),
          creators: String(rawData.creators || ''),
          createdAt: rawData.createdAt
        };
        console.log('Processed trends:', data);
        setTrends(data);
      } catch (error) {
        console.error('Error fetching trends:', error);
      }
    }

    fetchTrends();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ChatLayout
        conversations={conversations}
        setConversations={setConversations}
        activeConversation={activeConversation}
        setActiveConversation={setActiveConversation}
      >
        <ChatBot
          conversations={conversations}
          setConversations={setConversations}
          activeConversation={activeConversation}
          setActiveConversation={setActiveConversation}
        />
      </ChatLayout>
      
      {/* Debug section */}
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Debug: Latest Trends Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium">Topics:</p>
            <pre className="text-xs bg-white p-2 rounded mt-1 whitespace-pre-wrap">
              {trends?.topics || ''}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium">Hashtags:</p>
            <pre className="text-xs bg-white p-2 rounded mt-1 whitespace-pre-wrap">
              {trends?.hashtags || ''}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium">Songs:</p>
            <pre className="text-xs bg-white p-2 rounded mt-1 whitespace-pre-wrap">
              {trends?.songs || ''}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium">Creators:</p>
            <pre className="text-xs bg-white p-2 rounded mt-1 whitespace-pre-wrap">
              {trends?.creators || ''}
            </pre>
          </div>
        </div>
        {trends?.createdAt && (
          <p className="text-xs text-gray-500 mt-2">
            Last Updated: {new Date(trends.createdAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
