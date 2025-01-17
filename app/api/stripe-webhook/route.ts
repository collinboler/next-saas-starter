import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/clerk-sdk-node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

async function getSubscriptionStatus(customerId: string): Promise<'active' | 'inactive'> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    return subscriptions.data.length > 0 ? 'active' : 'inactive';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return 'inactive';
  }
}

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

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        
        if (!userId) {
          throw new Error('No user ID found in session');
        }

        // Get or create Stripe customer
        let stripeCustomerId = session.customer as string;
        if (!stripeCustomerId) {
          const user = await clerkClient.users.getUser(userId);
          const customer = await stripe.customers.create({
            email: user.emailAddresses[0].emailAddress,
            metadata: { userId },
          });
          stripeCustomerId = customer.id;
        }

        // Get current user to preserve existing metadata
        const user = await clerkClient.users.getUser(userId);
        
        // Force subscription status to active since checkout just completed
        const subscriptionId = session.subscription as string;
        
        // Update user metadata
        await clerkClient.users.updateUser(userId, {
          privateMetadata: {
            ...user.privateMetadata,
            stripeCustomerId,
            subscriptionStatus: 'active',
            subscriptionId,
            credits: 100, // Set to 100 for pro users
            lastCreditReset: new Date().toISOString(),
          },
          publicMetadata: {
            ...user.publicMetadata,
            subscriptionStatus: 'active', // Also set in public for easy access
          }
        });
        break;

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userIdFromCustomer = customer.metadata.userId;

        if (!userIdFromCustomer) {
          throw new Error('No user ID found in customer metadata');
        }

        const currentUser = await clerkClient.users.getUser(userIdFromCustomer);
        const status = subscription.status === 'active' ? 'active' : 'inactive';
        const credits = status === 'active' ? 100 : 10;
        
        await clerkClient.users.updateUser(userIdFromCustomer, {
          privateMetadata: {
            ...currentUser.privateMetadata,
            subscriptionStatus: status,
            subscriptionId: subscription.id,
            credits,
            lastCreditReset: new Date().toISOString(),
          },
          publicMetadata: {
            ...currentUser.publicMetadata,
            subscriptionStatus: status, // Also update public metadata
          }
        });
        break;
    }

    return new NextResponse('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook processing failed', { status: 500 });
  }
} 