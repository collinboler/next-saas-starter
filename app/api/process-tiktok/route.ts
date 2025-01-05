import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        // Step 1: Get video and audio URLs from TikTok
        const tiktokResponse = await fetch(
            `https://tiktokdownloadapi.vercel.app/tiktok/api.php?url=${encodeURIComponent(url)}`
        );
        
        if (!tiktokResponse.ok) {
            throw new Error('Failed to fetch TikTok video data');
        }

        const tiktokData = await tiktokResponse.json();
        
        // Step 2: Download the audio file
        const audioResponse = await fetch(tiktokData.audio);
        if (!audioResponse.ok) {
            throw new Error('Failed to fetch audio file');
        }

        // Convert audio response to blob
        const audioBlob = await audioResponse.blob();
        const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

        // Step 3: Transcribe using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
        });

        return Response.json({
            success: true,
            video: tiktokData.video,
            audio: tiktokData.audio,
            transcription: transcription.text
        });
    } catch (error) {
        console.error('Error processing TikTok video:', error);
        return Response.json(
            { error: error instanceof Error ? error.message : 'Failed to process TikTok video' },
            { status: 500 }
        );
    }
} 