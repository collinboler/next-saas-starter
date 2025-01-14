import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;

  if (!userId) {
    return new NextResponse('No user ID found', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // Update user metadata to indicate pro subscription
        const user = await currentUser();
        if (user) {
          await user.update({
            privateMetadata: {
              ...user.privateMetadata,
              subscriptionStatus: 'active',
              subscriptionId: session.subscription as string,
            },
          });
        }
        break;

      case 'customer.subscription.deleted':
        // Remove pro subscription status
        const userToUpdate = await currentUser();
        if (userToUpdate) {
          await userToUpdate.update({
            privateMetadata: {
              ...userToUpdate.privateMetadata,
              subscriptionStatus: 'inactive',
              subscriptionId: null,
            },
          });
        }
        break;
    }

    return new NextResponse('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook processing failed', { status: 500 });
  }
} 