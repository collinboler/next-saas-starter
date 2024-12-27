import { NextResponse, NextRequest } from "next/server";
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', {
        status: 401,
      });
    }

    try {
        // Remove latest .txt file
        const scriptsDir = path.join(process.cwd(), 'scripts');
        const txtFiles = fs.readdirSync(scriptsDir)
            .filter(file => file.endsWith('.txt'))
            .map(file => ({
                name: file,
                path: path.join(scriptsDir, file),
                time: fs.statSync(path.join(scriptsDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (txtFiles.length > 0) {
            fs.unlinkSync(txtFiles[0].path);
            console.log(`Removed file: ${txtFiles[0].name}`);
        }

        // Execute Python script
        const scriptPath = path.join(scriptsDir, 'trending_scraper.py');
        const { stdout, stderr } = await execAsync(`python ${scriptPath}`);
        
        if (stderr) {
            console.error('Python script error:', stderr);
            return NextResponse.json({ 
                error: 'Script execution failed', 
                details: stderr 
            }, { status: 500 });
        }

        // Get the newly generated file
        const newTxtFiles = fs.readdirSync(scriptsDir)
            .filter(file => file.endsWith('.txt'))
            .map(file => ({
                name: file,
                path: path.join(scriptsDir, file),
                time: fs.statSync(path.join(scriptsDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (newTxtFiles.length > 0) {
            const fileContent = fs.readFileSync(newTxtFiles[0].path, 'utf-8');
            
            // Upload to OpenAI
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            // First create the file
            const file = await openai.files.create({
                file: fs.createReadStream(newTxtFiles[0].path),
                purpose: "assistants",
            });

            // Add file to vector store
            const response = await fetch('https://api.openai.com/v1/vector_stores/vs_abc123/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                    file_id: file.id
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to add file to vector store: ${response.statusText}`);
            }

            console.log("File uploaded and added to vector store:", file.id);
        }

        return NextResponse.json({ 
            message: "Cron job completed successfully",
            timestamp: new Date().toISOString(),
            scriptOutput: stdout
        }, { status: 200 });
    } catch (error) {
        console.error('Error executing cron job:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}