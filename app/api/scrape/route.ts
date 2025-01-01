import { NextRequest, NextResponse } from 'next/server';

console.log('[COLLIN] API Route loaded');

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  console.log('[COLLIN] POST request received');
  
  try {
    const body = await req.json();
    console.log('[COLLIN] Request body:', body);
    
    const { username } = body;
    if (!username) {
      throw new Error('Username is required');
    }
    
    console.log('[COLLIN] Starting scrape request for username:', username);
    
    if (!process.env.FIRECRAWL_API_KEY) {
      console.error('[COLLIN] FIRECRAWL_API_KEY not found in env');
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }
    console.log('[COLLIN] Found API key in env');

    const url = 'https://api.firecrawl.dev/v1/scrape';
    const requestBody = {
      url: `https://countik.com/tiktok-analytics/user/@${username}`,
      onlyMainContent: true,
      waitFor: 1000
    };

    // Make the request
    console.log('[COLLIN] Making request to Firecrawl:', {
      url,
      body: requestBody
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[COLLIN] Response status:', response.status);
    
    const responseText = await response.text();
    console.log('[COLLIN] Raw response:', responseText);

    if (!response.ok) {
      throw new Error(`Firecrawl API error (${response.status}): ${responseText}`);
    }

    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      console.error('[COLLIN] Failed to parse response as JSON:', e);
      throw new Error('Invalid JSON response from Firecrawl');
    }

    if (!responseJson.markdown) {
      console.error('[COLLIN] No markdown in response:', responseJson);
      throw new Error('No markdown content found in response');
    }

    console.log('[COLLIN] Successfully extracted markdown content');
    return new NextResponse(responseJson.markdown, { 
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('[COLLIN] Scrape route error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch TikTok data',
        details: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 