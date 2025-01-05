import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { url, metadata } = await req.json();

        // Step 1: Get video and audio URLs from TikTok
        const tiktokResponse = await fetch(
            `https://tiktokdownloadapi.vercel.app/tiktok/api.php?url=${encodeURIComponent(url)}`
        );
        
        if (!tiktokResponse.ok) {
            throw new Error(`Failed to fetch TikTok video data: ${tiktokResponse.status}`);
        }

        const tiktokData = await tiktokResponse.json();
        console.log('TikTok API Response:', tiktokData);
        
        if (!tiktokData.audio || !tiktokData.video) {
            throw new Error('Invalid response from TikTok API: Missing audio or video URL');
        }

        // Step 2: Download the audio file
        const audioResponse = await fetch(tiktokData.audio);
        if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio file: ${audioResponse.status}`);
        }

        // Log audio response details
        console.log('Audio Response Type:', audioResponse.headers.get('content-type'));

        // Convert audio response to blob
        const audioBlob = await audioResponse.blob();
        console.log('Audio Blob Type:', audioBlob.type);
        const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

        // Step 3: Transcribe using Whisper
        let transcriptionText = '';
        try {
            const transcription = await openai.audio.transcriptions.create({
                file: audioFile,
                model: "whisper-1",
            });
            console.log('Whisper Transcription Success:', transcription);
            transcriptionText = transcription.text;
        } catch (whisperError) {
            console.error('Whisper API Error:', whisperError);
            throw whisperError;
        }

        // Step 4: Combine transcription with metadata
        const enrichedTranscription = `
        Video Information (Create the new video based off this style):
        Caption: ${metadata.caption}
        Creator: ${metadata.username}
        Sound: ${metadata.soundTitle}
        Sound Link: ${metadata.soundLink}

        Transcription:
        ${transcriptionText}`;

        return Response.json({
            success: true,
            video: tiktokData.video,
            audio: tiktokData.audio,
            transcription: enrichedTranscription
        });
    } catch (error) {
        console.error('Error processing TikTok video:', error);
        return Response.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process TikTok video',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}