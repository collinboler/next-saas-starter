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
        console.log("1. Starting cron job...");

        // Remove latest .txt file
        const scriptsDir = path.join(process.cwd(), 'scripts');
        const txtFiles = fs.readdirSync(scriptsDir)
            .filter(file => file.endsWith('.txt'));
        
        console.log("2. Found existing txt files:", txtFiles);

        // Only delete if there are multiple files to avoid deleting the one we're about to create
        if (txtFiles.length > 1) {
            fs.unlinkSync(path.join(scriptsDir, txtFiles[0]));
            console.log(`3. Removed old file: ${txtFiles[0]}`);
        }

        // Execute Python script
        console.log("4. Executing Python script...");
        const scriptPath = path.join(scriptsDir, 'trending_scraper.py');
        console.log("Script path:", scriptPath);
        
        // Try different Python commands in order
        let pythonCommands = ['python3', 'python', '/usr/local/bin/python3'];
        let executed = false;
        let lastError = '';
        let scriptOutput = '';
        
        for (const cmd of pythonCommands) {
            try {
                console.log(`Attempting to execute with ${cmd}...`);
                const fullCommand = `${cmd} "${scriptPath}"`;
                console.log('Executing command:', fullCommand);
                const { stdout, stderr } = await execAsync(fullCommand, {
                    env: {
                        ...process.env,
                        PYTHONUNBUFFERED: '1'
                    }
                });
                scriptOutput = stdout;
                console.log("5. Python script output:", stdout);
                if (stderr) {
                    console.error("5a. Python script error:", stderr);
                }
                executed = true;
                break;
            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                console.log(`Failed with ${cmd}:`, lastError);
                continue;
            }
        }
        
        if (!executed) {
            throw new Error(`Failed to execute Python script with any command. Last error: ${lastError}`);
        }

        // Get the newly generated file
        console.log("6. Checking for new txt files...");
        const newTxtFiles = fs.readdirSync(scriptsDir)
            .filter(file => file.endsWith('.txt'));
        
        console.log("7. Found new txt files:", newTxtFiles);

        if (newTxtFiles.length > 0) {
            console.log("8. Reading new file content...");
            const filePath = path.join(scriptsDir, newTxtFiles[0]);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            console.log("9. File content preview:", fileContent.substring(0, 200));
            
            // Upload to OpenAI
            console.log("10. Initializing OpenAI...");
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            console.log("11. Creating OpenAI file...");
            const file = await openai.files.create({
                file: fs.createReadStream(filePath),
                purpose: "assistants",
            });
            console.log("12. File created:", file.id);

            // Add file to vector store
            try {
                console.log("Attempting to add file to vector store...");
                console.log("Vector store ID:", process.env.OPENAI_VECTOR_STORE_ID);
                console.log("File ID:", file.id);
                
                const response = await fetch(`https://api.openai.com/v1/vector_stores/${process.env.OPENAI_VECTOR_STORE_ID}/files`, {
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

                const responseData = await response.json();
                
                if (!response.ok) {
                    console.error("Failed to add file to vector store:");
                    console.error("Status:", response.status);
                    console.error("Status Text:", response.statusText);
                    console.error("Response Data:", responseData);
                    throw new Error(`Failed to add file to vector store: ${response.statusText}`);
                }

                console.log("Successfully added file to vector store:");
                console.log("Response Status:", response.status);
                console.log("Response Data:", responseData);

            } catch (error) {
                console.error("Error during vector store upload:", error);
                throw error;
            }

            console.log("File uploaded and added to vector store:", file.id);
        } else {
            console.log("8a. No new txt files found!");
        }

        console.log("13. Cron job completed!");
        return NextResponse.json({ 
            message: "Cron job completed successfully",
            timestamp: new Date().toISOString(),
            scriptOutput: scriptOutput
        }, { status: 200 });
    } catch (error) {
        console.error("ERROR in cron job:", error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}