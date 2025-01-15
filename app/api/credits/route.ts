import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      credits: user.privateMetadata.credits || 0,
      lastReset: user.privateMetadata.lastCreditReset || null,
    });
  } catch (error) {
    console.error('Failed to get credits:', error);
    return new NextResponse('Failed to get credits', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const isPro = user.publicMetadata.subscriptionStatus === 'active';
    const dailyCredits = isPro ? 100 : 10;

    await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        credits: dailyCredits,
        lastCreditReset: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      credits: dailyCredits,
      lastReset: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to reset credits:', error);
    return new NextResponse('Failed to reset credits', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const { action } = await req.json();
    const currentCredits = (user.privateMetadata.credits as number) || 0;
    const creditCost = action === 'create' ? 2 : action === 'remix' ? 1 : 1;

    if (currentCredits < creditCost) {
      return new NextResponse('Insufficient credits', { status: 400 });
    }

    await clerkClient.users.updateUser(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        credits: currentCredits - creditCost,
      },
    });

    return NextResponse.json({
      credits: currentCredits - creditCost,
      lastReset: user.privateMetadata.lastCreditReset,
    });
  } catch (error) {
    console.error('Failed to update credits:', error);
    return new NextResponse('Failed to update credits', { status: 500 });
  }
} 