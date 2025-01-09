import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { topic, reference } = await req.json();
    
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not set');
    }

    // Single call to Perplexity for script generation
    const scriptResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: "You are a TikTok script generator. Generate a script that matches the style of the reference video if provided. Return your response in JSON format with the following fields: script (the generated script), caption (a catchy caption), media (relevant video/image links), and sources (reference links used)."
          },
          {
            role: "user",
            content: `Create a TikTok video script on ${topic}.${
              reference ? `\nHave the script be in exactly the transcript style as this:\n${reference.transcription}\nAlso, create a caption exactly the same style as this:\n${reference.caption}` : ''
            }

And return links to relevant videos and images (media) based on ${topic} that the user can use in their video, and return links to the sources you used to derive information about the topic.

Return your final answer like as a string that resembles JSON, but not exactly JSON. Don't include things like backticks, or say the word json, or have newlines out side of the ""
Example response template:
{
 "script": "generated script",
 "caption": "generated caption",
 "media": "found media links",
 "sources": "source links used"
}`
          }
        ]
      })
    });

    if (!scriptResponse.ok) {
      throw new Error(`Perplexity API error: ${scriptResponse.status}`);
    }

    const perplexityData = await scriptResponse.json();
    console.log('Full Perplexity Response:', perplexityData);
    
    const result = perplexityData.choices[0].message.content;

    // Parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      console.error('Failed to parse Perplexity response as JSON:', e);
      throw new Error('Invalid response format from Perplexity');
    }

    // Return the parsed JSON response
    return Response.json(parsedResult);
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