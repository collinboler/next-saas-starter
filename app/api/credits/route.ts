import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable');
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Get credits
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await clerk.users.getUser(userId);
    return NextResponse.json({
      credits: user.publicMetadata.credits || 0,
      lastReset: user.publicMetadata.lastCreditReset
    });
  } catch (error) {
    console.error('GET - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to get credits',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Initialize or reset credits
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await clerk.users.getUser(userId);
    const lastReset = user.publicMetadata.lastCreditReset as string;
    const now = new Date();
    const est = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    
    // If no lastReset or it's a new day in EST, reset credits
    if (!lastReset || new Date(lastReset).toDateString() !== est.toDateString()) {
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          credits: 10,
          lastCreditReset: est.toISOString()
        }
      });

      return NextResponse.json({
        success: true,
        credits: 10,
        lastReset: est.toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Credits can only be reset once per day',
      credits: user.publicMetadata.credits,
      lastReset
    });
  } catch (error) {
    console.error('POST - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset credits',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Add test credits
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    console.log('PATCH - userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await clerk.users.getUser(userId);
    console.log('PATCH - current metadata:', user.publicMetadata);
    
    const currentCredits = (user.publicMetadata.credits as number) || 0;
    const newCredits = currentCredits + 10;
    
    console.log('PATCH - updating credits:', currentCredits, '->', newCredits);
    
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        credits: newCredits,
        lastCreditReset: user.publicMetadata.lastCreditReset || new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      previousCredits: currentCredits,
      credits: newCredits,
      message: 'Added 10 test credits'
    });
  } catch (error) {
    console.error('PATCH - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to add credits',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Use credits
export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await request.json();
  const creditCost = action === 'create' ? 2 : action === 'remix' ? 1 : 1;

  const user = await clerk.users.getUser(userId);
  const currentCredits = (user.publicMetadata.credits as number) || 0;

  if (currentCredits < creditCost) {
    return NextResponse.json({
      success: false,
      error: `Insufficient credits. Need ${creditCost} credits for this action.`,
      credits: currentCredits
    }, { status: 400 });
  }

  await clerk.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      credits: currentCredits - creditCost
    }
  });

  return NextResponse.json({
    success: true,
    credits: currentCredits - creditCost,
    action,
    creditCost
  });
} 