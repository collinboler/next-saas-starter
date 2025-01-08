import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
 
export async function POST(req: Request) {
  const headerPayload = headers();
  const evt = await req.json();
  
  // Simple logging of the webhook event
  console.log('Webhook event received:', evt.type);
  
  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name } = evt.data;
    console.log('User data:', { id, email_addresses, username, first_name, last_name });
    // For now, just log the data instead of trying to save to database
  }
 
  return new Response('', { status: 200 });
} 