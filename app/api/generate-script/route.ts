import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { topic, reference, style } = await req.json();
    
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not set');
    }

    // First, get content ideas and structure from Perplexity
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a TikTok script writing expert. Create engaging, viral-worthy scripts that capture attention in the first 3 seconds."
          },
          {
            role: "user",
            content: `Write a TikTok script about: ${topic}${reference ? `\nReference style: ${reference}` : ''}${style ? `\nStyle preferences: ${style}` : ''}`
          }
        ]
      })
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const initialScript = perplexityData.choices[0].message.content;

    // Then, enhance it with OpenAI Assistant
    const assistantResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: "You are a TikTok script enhancement expert. Your job is to take initial scripts and enhance them with hooks, transitions, and viral elements."
          },
          {
            role: "user",
            content: `Enhance this TikTok script with better hooks, transitions, and viral elements while maintaining its core message:\n\n${initialScript}`
          }
        ]
      })
    });

    if (!assistantResponse.ok) {
      throw new Error(`Assistant API error: ${assistantResponse.status}`);
    }

    const assistantData = await assistantResponse.json();
    const enhancedScript = assistantData.choices[0].message.content;

    return new Response(JSON.stringify({ script: enhancedScript }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in /api/generate-script:', error);
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