import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const threadId = req.nextUrl.searchParams.get('threadId');
    if (!threadId) {
      throw new Error('Thread ID is required');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = await openai.beta.threads.messages.list(threadId);
    
    return new Response(JSON.stringify(messages.data.map(msg => ({
      role: msg.role,
      content: msg.content[0].type === 'text' ? msg.content[0].text.value : ''
    }))), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching thread messages:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 