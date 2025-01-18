import { NextRequest } from 'next/server';

function getVideoId(youtubeUrl: string): string {
    if (youtubeUrl.includes("watch?v=")) {
        return youtubeUrl.split("watch?v=")[1].split("&")[0];
    } else if (youtubeUrl.includes("youtu.be/")) {
        return youtubeUrl.split("youtu.be/")[1];
    }
    return youtubeUrl;
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        const videoId = getVideoId(url);

        // Use the YouTube captions API
        const response = await fetch(`https://youtube-transcript.vercel.app/api/transcript/${videoId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch transcript');
        }

        const data = await response.json();
        
        if (!data || !data.transcript) {
            throw new Error('No transcript available for this video');
        }

        // Format the transcript
        const transcript = data.transcript
            .map((item: { text: string }) => item.text)
            .join(' ');

        // Format the response similar to TikTok processing
        const enrichedTranscription = `
        Video Information:
        Source: YouTube
        Video ID: ${videoId}
        URL: ${url}

        Transcription:
        ${transcript}`;

        return Response.json({
            success: true,
            transcription: enrichedTranscription
        });
    } catch (error) {
        console.error('Error processing YouTube video:', error);
        return Response.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process YouTube video',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
} 