import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { clerkClient } from '@clerk/nextjs'

export async function POST(req: Request) {
  console.log('Webhook received')
  
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  console.log('Headers:', { svix_id, svix_timestamp, svix_signature })

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers')
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);
  
  console.log('Webhook payload:', payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
  console.log('Webhook secret present:', !!process.env.CLERK_WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
    console.log('Webhook verified successfully')
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type;
  console.log('Event type:', eventType)

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, ...attributes } = evt.data;
    const email = email_addresses[0].email_address;
    
    console.log('Processing user:', { id, email, attributes })

    try {
      // Create or update user in database
      const user = await db.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email: email,
          name: `${attributes.first_name || ''} ${attributes.last_name || ''}`.trim(),
          role: 'CLIENT' // Always set CLIENT role for new users
        },
        update: {
          email: email,
          name: `${attributes.first_name || ''} ${attributes.last_name || ''}`.trim()
          // Don't update role here to preserve existing role
        }
      });
      
      console.log('User upserted successfully:', user)

      // Update Clerk user metadata with role
      await clerkClient.users.updateUser(id, {
        publicMetadata: { role: user.role }
      });
      
      console.log('Clerk metadata updated')

      return new Response('User synchronized successfully', { status: 200 });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Error processing webhook', { status: 500 });
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
