import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface TrendingTopic {
    topic: string;
    score: number;
}

export async function GET() {
    try {
        // Get all files in the scripts directory
        const scriptsDir = path.join(process.cwd(), 'scripts');
        const files = fs.readdirSync(scriptsDir);

        // Filter for .txt files and sort by date (newest first)
        const txtFiles = files
            .filter(file => file.endsWith('.txt'))
            .sort((a, b) => {
                const statA = fs.statSync(path.join(scriptsDir, a));
                const statB = fs.statSync(path.join(scriptsDir, b));
                return statB.mtime.getTime() - statA.mtime.getTime();
            });

        if (txtFiles.length === 0) {
            throw new Error('No txt files found');
        }

        // Read the latest file
        const latestFile = txtFiles[0];
        const fileContent = fs.readFileSync(path.join(scriptsDir, latestFile), 'utf-8');

        // Extract trending keywords section
        const keywordsSection = fileContent.split('Trending Keywords and Scores:')[1];
        if (!keywordsSection) {
            throw new Error('No trending keywords section found');
        }

        // Parse the keywords and scores
        const trendingTopics: TrendingTopic[] = keywordsSection
            .split('\n')
            .filter(line => line.trim() && line.includes('.'))
            .map(line => {
                const match = line.match(/\d+\.\s*(.*?)\s*-\s*Score:\s*(\d+)%/);
                if (match) {
                    return {
                        topic: match[1].trim(),
                        score: parseInt(match[2], 10)
                    };
                }
                return null;
            })
            .filter((item): item is TrendingTopic => item !== null)
            .slice(0, 32); // Get up to 32 topics

        return NextResponse.json({ topics: trendingTopics });
    } catch (error) {
        console.error('Error fetching trending topics:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch trending topics' },
            { status: 500 }
        );
    }
} 