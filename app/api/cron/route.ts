import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', {
        status: 401,
      });
    }
    console.log("Cron job run at: ", new Date().toISOString());
   
    return NextResponse.json({ message: "Cron job ran at +  " + new Date }, { status: 200 });
}