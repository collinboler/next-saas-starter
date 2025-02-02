import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { topic, reference, style } = body;

        let systemPrompt = `You are a professional TikTok script writer. Create a viral TikTok script that follows this exact format:

Part 1: Hook
[Scene 1]
[Voice-over] The hook/opening line
[On-screen visual] Description of what's shown on screen
[Text-overlay] Any text overlays or captions

Part 2: Scene
[Scene 2]
[Voice-over] The main content voice-over
[On-screen visual] Description of visuals
[Text-overlay] Text overlays

Part 3: Call to Action
[Scene 3]
[Voice-over] The call to action or closing line
[On-screen visual] Final visuals
[Text-overlay] Final text overlays

Each part should be separated by a blank line. Each scene should include all three elements: Voice-over, On-screen visual, and Text-overlay.
Make the script engaging, concise, and optimized for TikTok's format.`;

        let userPrompt = `Create a TikTok script about: ${topic}`;

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
        });

        const script = completion.choices[0].message.content || '';

        // Generate a caption
        const captionCompletion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a TikTok caption writer. Create a compelling caption with relevant hashtags that will help this video go viral. Keep it concise and engaging."
                },
                {
                    role: "user",
                    content: `Write a TikTok caption for this script:\n\n${script}`
                }
            ],
            temperature: 0.7,
        });

        // Generate media suggestions and sources
        const mediaCompletion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a TikTok content researcher. Based on the script, suggest relevant media (stock footage, images, music) and credible sources that could be used in the video. Return your suggestions in JSON format with 'media' and 'sources' arrays."
                },
                {
                    role: "user",
                    content: `Suggest media and sources for this script:\n\n${script}`
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const mediaData = JSON.parse(mediaCompletion.choices[0].message.content || '{"media":[],"sources":[]}');

        return NextResponse.json({
            script,
            caption: captionCompletion.choices[0].message.content || '',
            media: mediaData.media || [],
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