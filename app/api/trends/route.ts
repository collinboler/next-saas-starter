import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { desc } from 'drizzle-orm';
import { dailyTrends } from '@/lib/db/schema';

export async function GET(request: Request) {
  try {
    console.log('Fetching trends from database...');
    const trends = await db.query.dailyTrends.findFirst({
      orderBy: [desc(dailyTrends.createdAt)],
    });

    console.log('Retrieved trends:', trends);

    if (!trends) {
      console.log('No trends found in database');
      return NextResponse.json({ error: 'No trends found' }, { status: 404 });
    }

    // Parse the JSON strings and extract the data property
    const parsedTrends = {
      topics: JSON.parse(trends.topics || '{"data": ""}').data,
      hashtags: JSON.parse(trends.hashtags || '{"data": ""}').data,
      songs: JSON.parse(trends.songs || '{"data": ""}').data,
      creators: JSON.parse(trends.creators || '{"data": ""}').data,
      createdAt: trends.createdAt
    };

    console.log('Parsed trends:', parsedTrends);
    return NextResponse.json(parsedTrends);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database error: ' + error.message },
      { status: 500 }
    );
  }
}