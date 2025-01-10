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

        if (text.length > 4096) {
            return NextResponse.json({ 
                error: 'Text too long. Maximum length is 4096 characters.' 
            }, { status: 400 });
        }

        console.log('Attempting TTS generation:', {
            textLength: text.length,
            voice: voice || "alloy"
        });

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice || "alloy",
            input: text,
        });

        // Convert the raw response to a buffer
        const buffer = Buffer.from(await mp3.arrayBuffer());

        if (buffer.length === 0) {
            console.error('Generated empty buffer');
            return NextResponse.json({ error: 'Generated empty audio' }, { status: 500 });
        }

        console.log('TTS generation successful:', {
            bufferLength: buffer.length
        });

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
            { error: error instanceof Error ? error.message : 'Failed to generate audio' },
            { status: 500 }
        );
    }
} 