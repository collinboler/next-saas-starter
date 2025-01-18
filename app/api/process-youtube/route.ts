import { NextRequest } from 'next/server';
import { PythonShell } from 'python-shell';

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
        const body = await req.json();
        const url = body.url;
        const videoId = getVideoId(url);
        console.log('Processing YouTube video ID:', videoId);

        // Use python-shell to run the YouTube transcript API
        const options = {
            mode: 'text' as const,
            pythonPath: 'python3',
            args: [videoId]
        };

        const script = `
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def fetch_transcript(video_id):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        formatter = TextFormatter()
        formatted_transcript = formatter.format_transcript(transcript)
        return formatted_transcript
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    video_id = "${videoId}"
    transcript = fetch_transcript(video_id)
    if transcript:
        print(transcript)
    else:
        print("No transcript available")
`;

        // Run the Python script
        const result = await new Promise<string>((resolve, reject) => {
            try {
                PythonShell.runString(script, options).then((results: string[]) => {
                    if (results && results.length > 0) {
                        resolve(results.join('\n'));
                    } else {
                        reject(new Error('No transcript found'));
                    }
                }).catch((err: Error) => {
                    console.error('Python error:', err);
                    reject(err);
                });
            } catch (err) {
                console.error('Python execution error:', err);
                reject(err);
            }
        });

        // Format the response similar to TikTok processing
        const enrichedTranscription = `
        Video Information:
        Source: YouTube
        Video ID: ${videoId}
        URL: ${url}

        Transcription:
        ${result}`;

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