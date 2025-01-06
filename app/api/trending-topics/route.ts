import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Get all files in the scripts directory
        const scriptsDir = path.join(process.cwd(), 'scripts');
        const files = fs.readdirSync(scriptsDir);
        
        // Filter for .txt files and sort by date (newest first)
        const txtFiles = files
            .filter(file => file.endsWith('.txt'))
            .sort((a, b) => {
                const dateA = new Date(a.split('.')[0]);
                const dateB = new Date(b.split('.')[0]);
                return dateB.getTime() - dateA.getTime();
            });

        if (txtFiles.length === 0) {
            return NextResponse.json({ error: 'No trending data files found' }, { status: 404 });
        }

        // Read the latest file
        const latestFile = txtFiles[0];
        const filePath = path.join(scriptsDir, latestFile);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        // Parse the content into sections
        const sections = {
            topics: [] as { topic: string; score: number }[],
            hashtags: [] as { topic: string; score: number }[],
            creators: [] as { topic: string; score: number }[]
        };

        let currentSection: keyof typeof sections | null = null;

        fileContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            
            // Check for section headers
            if (trimmedLine.includes('Trending Keywords and Scores:')) {
                currentSection = 'topics';
                return;
            } else if (trimmedLine.includes('Trending Hashtags')) {
                currentSection = 'hashtags';
                return;
            } else if (trimmedLine.includes('Trending Creators in the US')) {
                currentSection = 'creators';
                return;
            }

            // Skip empty lines or if no current section
            if (!trimmedLine || !currentSection) return;

            // Parse the line based on the section
            if (currentSection === 'topics') {
                // Format: "1. topic name - Score: 85%"
                const match = trimmedLine.match(/^\d+\.\s*(.+?)\s*-\s*Score:\s*(\d+)%$/);
                if (match) {
                    sections.topics.push({
                        topic: match[1].trim(),
                        score: parseInt(match[2])
                    });
                }
            } else if (currentSection === 'hashtags') {
                // Format: "1. hashtag" or just "hashtag"
                const match = trimmedLine.match(/^(?:\d+\.)?\s*(.+)$/);
                if (match && !match[1].startsWith('Trending')) {
                    sections.hashtags.push({
                        topic: match[1].trim(),
                        score: Math.floor(Math.random() * 30) + 70 // Random score between 70-100 for demo
                    });
                }
            } else if (currentSection === 'creators') {
                // Format: "1. Username: username, Nickname: nickname"
                const match = trimmedLine.match(/^\d+\.\s*Username:\s*([^,]+)/);
                if (match) {
                    sections.creators.push({
                        topic: match[1].trim(),
                        score: Math.floor(Math.random() * 30) + 70 // Random score between 70-100 for demo
                    });
                }
            }
        });

        return NextResponse.json({
            topics: sections.topics,
            hashtags: sections.hashtags,
            creators: sections.creators
        });

    } catch (error) {
        console.error('Error reading trending data:', error);
        return NextResponse.json({ error: 'Failed to read trending data' }, { status: 500 });
    }
} 