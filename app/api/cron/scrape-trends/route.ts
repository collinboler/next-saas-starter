import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(req: Request) {
  // Verify cron authentication header
  const authHeader = req.headers.get('X-Cron-Auth');
  if (authHeader !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Run the Python script
    const { stdout, stderr } = await execAsync('python scripts/run_scrapers.py');
    
    if (stderr) {
      console.error('Scraper Error:', stderr);
      return new NextResponse('Scraper Error', { status: 500 });
    }

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error('Failed to run scraper:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 