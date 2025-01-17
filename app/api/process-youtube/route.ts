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
        const { url } = await req.json();
        const videoId = getVideoId(url);

        // Use python-shell to run the code directly
        const options = {
            mode: 'text' as const,
            pythonOptions: ['-u'],
            pythonPath: 'python3',
            args: [videoId]
        };

        const script = `
import sys
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def fetch_transcript(video_id):
    try:
        print(f"Fetching transcript for video ID: {video_id}", file=sys.stderr)
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        formatter = TextFormatter()
        formatted_transcript = formatter.format_transcript(transcript)
        print("Successfully fetched and formatted transcript", file=sys.stderr)
        return formatted_transcript
    except Exception as e:
        print(f"Error fetching transcript: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    video_id = sys.argv[1]
    print(f"Processing video ID: {video_id}", file=sys.stderr)
    transcript = fetch_transcript(video_id)
    if transcript:
        print(transcript)
    else:
        print("No transcript available", file=sys.stderr)
        sys.exit(1)
`;

        // Run the Python code
        const result = await new Promise<string>((resolve, reject) => {
            let output = '';
            let error = '';

            try {
                PythonShell.runString(script, options).then(results => {
                    if (results && results.length > 0) {
                        output = results.join('\n');
                        resolve(output);
                    } else {
                        reject(new Error('No transcript found'));
                    }
                }).catch(err => {
                    console.error('Python error:', err);
                    reject(new Error(err.message));
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