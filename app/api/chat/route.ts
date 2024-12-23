// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, threadId } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    
    if (!process.env.OPENAI_ASSISTANT_ID) {
      throw new Error('OPENAI_ASSISTANT_ID is not set');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Use existing thread or create a new one
    const thread = threadId 
      ? { id: threadId }
      : await openai.beta.threads.create();

    // Add message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: messages[messages.length - 1].content
    });

    // Create run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID
    });

    // Create stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const runStatus = await openai.beta.threads.runs.retrieve(
              thread.id,
              run.id
            );

            if (runStatus.status === 'completed') {
              const messages = await openai.beta.threads.messages.list(thread.id);
              const lastMessage = messages.data[0];
              
              if (lastMessage.content[0].type === 'text') {
                const text = lastMessage.content[0].text.value;
                controller.enqueue(new TextEncoder().encode(text));
              }
              break;
            } else if (
              runStatus.status === 'failed' ||
              runStatus.status === 'cancelled' ||
              runStatus.status === 'expired'
            ) {
              throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`);
            }

            // Wait before checking again
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    // Return the response with the thread ID in headers
    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
    // Add thread ID to response
    response.headers.set('x-thread-id', thread.id);
    
    return response;
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}