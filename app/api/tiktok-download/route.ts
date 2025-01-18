import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const videoUrl = searchParams.get('url');

        if (!videoUrl) {
            return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
        }

        const cleanUrl = videoUrl.split('?')[0];
        console.log('Processing TikTok URL:', cleanUrl);

        const response = await fetch(
            `https://tiktokdownloadapi.vercel.app/tiktok/api.php?url=${encodeURIComponent(cleanUrl)}`
        );

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('TikTok download error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process video' },
            { status: 500 }
        );
    }
} 