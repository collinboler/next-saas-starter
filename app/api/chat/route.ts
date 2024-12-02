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
  
  console.log('Retrieved trends from DB:', trends);
  
  if (!trends) return '';

  // Parse JSON data with error handling
  let topics = [], hashtags = [], songs = [], creators = [];
  
  try {
    topics = trends.topics ? JSON.parse(trends.topics) : [];
    hashtags = trends.hashtags ? JSON.parse(trends.hashtags) : [];
    songs = trends.songs ? JSON.parse(trends.songs) : [];
    creators = trends.creators ? JSON.parse(trends.creators) : [];
    
    console.log('Parsed trend data:', {
      topics,
      hashtags,
      songs,
      creators
    });
  } catch (error) {
    console.error('Error parsing trend data:', error);
  }

  const formattedTrends = `
Current TikTok Trends (Updated ${trends.createdAt.toLocaleDateString()}):

Topics:
${formatTrendList(topics)}

Hashtags:
${formatTrendList(hashtags)}

Songs:
${formatTrendList(songs)}

Creators:
${formatTrendList(creators)}
`;

  console.log('Formatted trends being sent to ChatGPT:', formattedTrends);
  return formattedTrends;
}

// Helper function to format trend lists
function formatTrendList(trends: any[]): string {
  if (!Array.isArray(trends)) return 'No data available';
  return trends.map((item, index) => `${index + 1}. ${item}`).join('\n');
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
    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant for our SaaS product. You have access to the latest TikTok trends and can provide insights based on this data:

${latestTrends}

Provide concise and friendly responses, incorporating trend data when relevant to the user's question.`
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
