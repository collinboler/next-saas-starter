import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function findPythonPath() {
  try {
    const { stdout } = await execAsync('which python3');
    return stdout.trim();
  } catch (error) {
    const commonPaths = [
      '/usr/local/bin/python3',
      '/usr/bin/python3',
      '/opt/homebrew/bin/python3',
      '/Library/Frameworks/Python.framework/Versions/3.11/bin/python3'
    ];
    
    for (const pythonPath of commonPaths) {
      try {
        await fs.access(pythonPath);
        return pythonPath;
      } catch {
        continue;
      }
    }
    throw new Error('Python 3 not found. Please install Python 3.');
  }
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json();
    
    // Ensure scripts directory exists
    const scriptsDir = path.join(process.cwd(), 'scripts');
    await fs.mkdir(scriptsDir, { recursive: true });
    
    // Check if parse.py exists
    const scriptPath = path.join(scriptsDir, 'parse.py');
    try {
      await fs.access(scriptPath);
    } catch {
      throw new Error(`Parse script not found at ${scriptPath}`);
    }
    
    // Write input data
    const tempFile = path.join(scriptsDir, 'temp_data.txt');
    await fs.writeFile(tempFile, data);
    
    // Find Python and execute script
    const pythonPath = await findPythonPath();
    console.log('Using Python at:', pythonPath);
    console.log('Script path:', scriptPath);
    console.log('Input file:', tempFile);
    
    const { stdout, stderr } = await execAsync(`"${pythonPath}" "${scriptPath}" "${tempFile}"`);
    
    if (stderr) {
      console.error('Python stderr:', stderr);
    }
    
    // Clean up
    await fs.unlink(tempFile).catch(console.error);
    
    return new NextResponse(stdout || 'No output from parser');
    
  } catch (error) {
    console.error('Parse route error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to parse data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 