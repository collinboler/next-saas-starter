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
        const body = await req.json();
        const url = body.url;
        const videoId = getVideoId(url);
        console.log('Processing YouTube video ID:', videoId);

        // Use Innertube API to fetch captions
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();
        
        // Extract the caption track URL from the YouTube page
        const captionTrackRegex = /"captionTracks":\[{"baseUrl":"([^"]+)"/;
        const match = html.match(captionTrackRegex);
        
        if (!match || !match[1]) {
            throw new Error('No captions available for this video');
        }

        // Decode the caption URL
        const captionUrl = decodeURIComponent(match[1]).replace(/\\u0026/g, '&');
        
        // Fetch the actual captions
        const captionsResponse = await fetch(captionUrl);
        const captionsXml = await captionsResponse.text();

        // Parse the XML to extract text
        const textRegex = /<text[^>]*>([^<]+)<\/text>/g;
        const texts: string[] = [];
        let textMatch;
        
        while ((textMatch = textRegex.exec(captionsXml)) !== null) {
            texts.push(decodeURIComponent(textMatch[1].replace(/\+/g, ' ')));
        }

        const transcript = texts.join(' ');

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