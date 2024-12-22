// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const payload = {
      model: 'gpt-4',
      messages,
      stream: true,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenAI API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: 'No response body from OpenAI' },
        { status: 500 }
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    break;
                  }
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices[0]?.delta?.content || '';
                    if (content) {
                      controller.enqueue(content);
                    }
                  } catch (e) {
                    console.error('Error parsing JSON:', e);
                  }
                }
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}