import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface MediaItem {
    type: string;
    description: string;
    source: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { topic, reference, style } = body;

        const systemPrompt = `You are a professional TikTok content creator. Create a complete TikTok content package that includes:

1. SCRIPT in this exact format:
***Hook:***
[Voice-over] The hook/opening line
[On-screen visual] Description of what's shown on screen
[Text-overlay] Any text overlays or captions

***Scene:***
[Voice-over] The main content voice-over
[On-screen visual] Description of visuals
[Text-overlay] Text overlays

***Call to Action:***
[Voice-over] The call to action or closing line
[On-screen visual] Final visuals
[Text-overlay] Final text overlays

2. CAPTION: Create a compelling TikTok caption with relevant hashtags (keep it concise and engaging)

3. MEDIA SUGGESTIONS: Provide specific media assets needed for the video in this JSON format:
{
    "media": [
        {
            "type": "video/image/music/sfx",
            "description": "what is needed",
            "source": "direct URL to the specific asset"
        }
    ],
    "sources": ["reference urls"]
}

For media sources, use:
- Videos: Pexels (https://www.pexels.com/videos/...)
- Images: Unsplash (https://unsplash.com/photos/...)
- Music: Pixabay Music (https://pixabay.com/music/...)
- Sound Effects: Pixabay (https://pixabay.com/sound-effects/...)

Return the response in JSON format with "script", "caption", and "mediaData" keys.`;

        let userPrompt = `Create a TikTok content package about: ${topic}`;
        if (reference) {
            userPrompt += `\n\nUse this video as reference for style and tone:\n${JSON.stringify(reference, null, 2)}`;
        }
        if (style) {
            userPrompt += `\n\nAdditional style instructions: ${style}`;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        const mediaData = response.mediaData || { media: [], sources: [] };

        // Validate media URLs
        const validatedMedia = mediaData.media.map((item: MediaItem) => ({
            ...item,
            source: item.source.startsWith('http') ? item.source : 
                item.type === 'video' ? 'https://www.pexels.com/videos/' :
                item.type === 'image' ? 'https://unsplash.com/photos/' :
                item.type === 'music' ? 'https://pixabay.com/music/' :
                'https://pixabay.com/sound-effects/'
        }));

        return NextResponse.json({
            script: response.script || '',
            caption: response.caption || '',
            media: validatedMedia,
            sources: mediaData.sources || []
        });
    } catch (error) {
        console.error('Error generating script:', error);
        return NextResponse.json(
            { error: 'Failed to generate script' },
            { status: 500 }
        );
    }
} 