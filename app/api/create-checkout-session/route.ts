import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = user.privateMetadata.stripeCustomerId as string;

    if (!stripeCustomerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0].emailAddress,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;
      
      // Store Stripe customer ID in private metadata
      await clerkClient.users.updateUser(userId, {
        privateMetadata: {
          ...user.privateMetadata,
          stripeCustomerId: customer.id,
        },
      });
    }

    // Check current subscription status
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    if (subscriptions.data.length > 0) {
      return new NextResponse('User already has an active subscription', { status: 400 });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.BASE_URL}`,
      cancel_url: `${process.env.BASE_URL}`,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse('Error creating checkout session', { status: 500 });
  }
} 