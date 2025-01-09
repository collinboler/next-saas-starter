import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ credits: 100 }); // Replace with your actual logic
}

export async function POST() {
  return NextResponse.json({ status: 'success' }); // Replace with your actual logic
} 