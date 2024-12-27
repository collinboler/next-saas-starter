import { NextResponse, NextRequest } from "next/server";
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', {
        status: 401,
      });
    }

    try {
        // Get the absolute path to the Python script
        const scriptPath = path.join(process.cwd(), 'scripts', 'trending_scraper.py');
        
        // Execute the Python script
        const { stdout, stderr } = await execAsync(`python ${scriptPath}`);
        
        if (stderr) {
            console.error('Python script error:', stderr);
            return NextResponse.json({ 
                error: 'Script execution failed', 
                details: stderr 
            }, { status: 500 });
        }

        console.log("Cron job run at: ", new Date().toISOString());
        console.log("Python script output:", stdout);

        return NextResponse.json({ 
            message: "Cron job completed successfully",
            timestamp: new Date().toISOString(),
            scriptOutput: stdout
        }, { status: 200 });
    } catch (error) {
        console.error('Error executing Python script:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}