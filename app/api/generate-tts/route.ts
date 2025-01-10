import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const { text, voice } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice || "alloy",
            input: text,
        });

        // Convert the raw response to a buffer
        const buffer = Buffer.from(await mp3.arrayBuffer());

        // Return the audio file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('TTS generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate audio' },
            { status: 500 }
        );
    }
} 