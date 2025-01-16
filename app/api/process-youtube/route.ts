import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

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

        // Create a temporary Python script
        const scriptContent = `
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def fetch_transcript(video_id):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        formatter = TextFormatter()
        return formatter.format_transcript(transcript)
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

video_id = "${videoId}"
transcript = fetch_transcript(video_id)
if transcript:
    print(transcript)
`;

        // Write the script to a temporary file
        const scriptPath = path.join(process.cwd(), 'temp_script.py');
        await writeFile(scriptPath, scriptContent);

        // Execute the Python script
        const { stdout, stderr } = await execAsync('python3 temp_script.py');

        if (stderr) {
            console.error('Python script error:', stderr);
            throw new Error('Failed to fetch YouTube transcript');
        }

        // Format the response similar to TikTok processing
        const enrichedTranscription = `
        Video Information:
        Source: YouTube
        Video ID: ${videoId}
        URL: ${url}

        Transcription:
        ${stdout}`;

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