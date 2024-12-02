// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { desc } from 'drizzle-orm';
import { dailyTrends } from '@/lib/db/schema';

export const runtime = 'edge';

async function getLatestTrends() {
  const trends = await db.query.dailyTrends.findFirst({
    orderBy: [desc(dailyTrends.createdAt)],
  });

  if (!trends) {
    return new Response('No trends found in database', { status: 404 });
  }

  try {
    // Return the raw data from the database
    return new Response(JSON.stringify({
      topics: trends.topics,
      hashtags: trends.hashtags,
      songs: trends.songs,
      creators: trends.creators,
      timestamp: trends.createdAt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(`Error fetching trend data: ${error}`, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const latestTrends = await getLatestTrends();

    // Check if it's a debug response
    if (latestTrends instanceof Response) {
      return latestTrends;
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant for our SaaS product. You have access to the latest TikTok trends and can provide insights based on this data:

${latestTrends}

Provide concise and friendly responses, incorporating trend data when relevant to the user's question.`,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [systemMessage, ...messages],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.error.message },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
