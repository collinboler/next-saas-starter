'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export function Analysis() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnalysisResult('');
    
    try {
      if (!username) {
        throw new Error('Please enter a TikTok username');
      }

      const cleanUsername = username.replace('@', '');
      
      console.log('[CLIENT] Starting analysis for username:', cleanUsername);
      
      // First API call to Firecrawl
      console.log('[CLIENT] Making request to /api/scrape...');
      const scrapeRequestBody = { username: cleanUsername };
      console.log('[CLIENT] Scrape request body:', scrapeRequestBody);

      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapeRequestBody),
        cache: 'no-store'
      });

      console.log('[CLIENT] Scrape response status:', scrapeResponse.status);
      
      const scrapeResponseText = await scrapeResponse.text();
      console.log('[CLIENT] Raw scrape response:', scrapeResponseText);

      if (!scrapeResponse.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(scrapeResponseText);
          console.error('[CLIENT] Scrape error:', errorData);
          errorMessage = errorData.details || errorData.error || 'Failed to fetch TikTok data';
        } catch (parseError) {
          console.error('[CLIENT] Error parsing error response:', parseError);
          errorMessage = scrapeResponseText || 'Unknown error occurred';
        }
        throw new Error(errorMessage);
      }

      if (!scrapeResponseText) {
        throw new Error('Empty response from scrape endpoint');
      }

      // Second API call to parse the data
      console.log('[CLIENT] Making request to /api/parse...');
      const parseRequestBody = { data: scrapeResponseText };
      console.log('[CLIENT] Parse request body:', parseRequestBody);

      const parseResponse = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parseRequestBody),
      });

      console.log('[CLIENT] Parse response status:', parseResponse.status);
      console.log('[CLIENT] Parse response headers:', Object.fromEntries(parseResponse.headers.entries()));

      const parseResponseText = await parseResponse.text();
      console.log('[CLIENT] Raw parse response:', parseResponseText);

      if (!parseResponse.ok) {
        try {
          const parseError = JSON.parse(parseResponseText);
          console.error('[CLIENT] Parse error:', parseError);
          throw new Error(parseError.details || 'Failed to parse data');
        } catch (parseError) {
          console.error('[CLIENT] Error parsing error response:', parseError);
          throw new Error(parseResponseText || 'Failed to parse data');
        }
      }

      if (!parseResponseText) {
        console.error('[CLIENT] Empty response from parse endpoint');
        throw new Error('Empty response from parse endpoint');
      }

      console.log('[CLIENT] Setting analysis result...');
      setAnalysisResult(parseResponseText);
      
    } catch (err) {
      console.error('[CLIENT] Analysis error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'An error occurred while analyzing the TikTok account'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="Enter TikTok username (with or without @)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : <Send className="h-4 w-4" />}
        </Button>
      </form>

      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {analysisResult && (
        <div className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: analysisResult }} />
        </div>
      )}
    </div>
  );
} 