import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { topic, reference, style } = await req.json();
    
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not set');
    }

    // First call: Topic Analysis
    const topicAnalysisResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: "You are a TikTok trend analyst. You must provide real-time trending information about the user's input. Format your response with ### for headings and ** ** for important terms."
          },
          {
            role: "user",
            content: `Provide real-time (right now, not two days ago) trending information as if you are providing everything a video script writer (who doesn't have access to internet) needs to know before making a TikTok script. You aren't making the script yourself, but you're explaining the following input:\n${topic}`
          }
        ]
      })
    });

    if (!topicAnalysisResponse.ok) {
      throw new Error(`Perplexity Topic Analysis error: ${topicAnalysisResponse.status}`);
    }

    const perplexityData = await topicAnalysisResponse.json();
    const topicAnalysis = perplexityData.choices[0].message.content;

    // Second call: Reference Video Analysis (if provided)
    let referenceAnalysis = '';
    if (reference) {
      // Structure the reference data
      const referenceData = {
        url: reference,
        caption: '',
        username: '',
        soundTitle: '',
        transcription: '',
        ...reference // This will override the defaults with any provided data
      };

      const referenceAnalysisResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: "You are a TikTok video analyst. Analyze the style, format, and content of reference video. Format your response with ### for headings and ** ** for important terms."
            },
            {
              role: "user",
              content: `Analyze this TikTok video's content and structure:

              Caption: ${referenceData.caption}
              Creator: ${referenceData.username}
              Sound: ${referenceData.soundTitle}
              Transcription: ${referenceData.transcription}

              Please analyze:
              1. The hook and how it grabs attention
              2. The overall structure and flow
              3. The call to action and engagement strategy
              4. The caption's effectiveness and hashtag usage
              5. How the sound/music choice enhances the content
              
              Provide specific insights on how to replicate this style while maintaining originality.`
            }
          ]
        })
      });

      if (!referenceAnalysisResponse.ok) {
        throw new Error(`Perplexity Reference Analysis error: ${referenceAnalysisResponse.status}`);
      }

      const referenceAnalysisData = await referenceAnalysisResponse.json();
      referenceAnalysis = referenceAnalysisData.choices[0].message.content;
    }

    // Generate script with OpenAI using both analyses
    const assistantResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a TikTok script enhancement expert. Your job is to create a script that is engaging, viral-worthy, and captures attention in the first 3 seconds."
          },
          {
            role: "user",
            content: `Create a s:\n\nTopic Analysis:\n${topicAnalysis}\n\nReference Analysis:\n${referenceAnalysis}\n\nCreate a TikTok script about: ${topic}${style ? `\nStyle preferences: ${style}` : ''}`
          }
        ]
      })
    });

    if (!assistantResponse.ok) {
      throw new Error(`OpenAI API error: ${assistantResponse.status}`);
    }

    const assistantData = await assistantResponse.json();
    const script = assistantData.choices[0].message.content;

    // Return separate analyses
    return Response.json({ 
      script, 
      topicAnalysis,
      referenceAnalysis 
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