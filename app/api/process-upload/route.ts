import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            throw new Error('No file provided');
        }

        // Convert File to audio file for Whisper API
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // If it's an MP4, we need to extract the audio first
        let audioFile;
        if (file.type === 'video/mp4') {
            // For now, we'll assume the file is already an audio file
            // In a production environment, you'd want to use ffmpeg or similar to extract audio
            audioFile = new File([buffer], 'audio.mp3', { type: 'audio/mpeg' });
        } else {
            audioFile = new File([buffer], file.name, { type: file.type });
        }

        // Transcribe using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
        });

        // Format the response similar to TikTok processing
        const enrichedTranscription = `
        Video Information:
        File: ${file.name}
        Type: ${file.type}

        Transcription:
        ${transcription.text}`;

        return Response.json({
            success: true,
            transcription: enrichedTranscription
        });
    } catch (error) {
        console.error('Error processing uploaded file:', error);
        return Response.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process uploaded file',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
} 