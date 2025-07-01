
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
// Conekta import is removed as it's not used in the current implementation.
// To re-enable signature verification, you would need to use Conekta v5 SDK.
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  console.log("API ROUTE: /api/conekta-webhook reached.");

  const CONEKTA_WEBHOOK_SIGNING_SECRET = process.env.CONEKTA_WEBHOOK_SIGNING_SECRET;

  if (!CONEKTA_WEBHOOK_SIGNING_SECRET) {
    console.warn("WARNING: CONEKTA_WEBHOOK_SIGNING_SECRET is not set. Webhook signature verification is disabled. THIS IS A SECURITY RISK.");
  }

  const rawBody = await request.text();
  const signature = headers().get('conekta-signature');
  let event;

  try {
    // IMPORTANT: In a real production environment, signature verification is critical for security.
    // The commented out code below is for Conekta v4. To implement verification,
    // you would need to use the Conekta v5 SDK with its own verification logic.
    // For now, we'll parse the body directly as signature verification is disabled.
    event = JSON.parse(rawBody);
    console.log("Conekta event received and parsed. Type:", event.type);
  } catch (error: any) {
    console.error('Webhook Error: Could not parse event body.', error);
    return NextResponse.json({ error: `Webhook error: ${error.message}` }, { status: 400 });
  }

  // Handle the 'order.paid' event, which is triggered when an SPEI payment is confirmed.
  if (event.type === 'order.paid') {
    const order = event.data.object;
    console.log(`Processing 'order.paid' event for order ID: ${order.id}`);

    const firebaseUid = order.metadata?.firebaseUid;
    const creditsToAdd = order.metadata?.credits ? parseInt(order.metadata.credits, 10) : 0;

    if (!firebaseUid || !creditsToAdd) {
      console.error('Webhook for order.paid is missing metadata (firebaseUid or credits).', { orderId: order.id, metadata: order.metadata });
      // Return 200 to acknowledge receipt and prevent Conekta from retrying.
      // This is a configuration issue on our side, not Conekta's.
      return NextResponse.json({ received: true, message: 'Metadata missing, cannot process.' });
    }

    try {
      const { db } = await connectToDatabase();
      const userProfileCollection = db.collection<UserProfile>('userProfiles');

      const result = await userProfileCollection.findOneAndUpdate(
        { firebaseUid: firebaseUid },
        { $inc: { credits: creditsToAdd } },
        { returnDocument: 'after' }
      );

      if (result) {
        console.log(`Successfully added ${creditsToAdd} credits to user ${firebaseUid}. New balance: ${result.credits}`);
        // Here you could trigger another service, like sending a confirmation email.
      } else {
        // This is a critical failure. The user paid, but we couldn't find their profile.
        // This might require manual intervention.
        console.error(`CRITICAL: User with firebaseUid ${firebaseUid} not found. Could not add credits for order ${order.id}.`);
      }

    } catch (dbError: any) {
      console.error('Database error while processing webhook:', dbError);
      // Return 500 to tell Conekta something went wrong on our side and it should retry.
      return NextResponse.json({ error: 'Database error occurred.', details: dbError.message }, { status: 500 });
    }
  } else {
    console.log(`Received and acknowledged unhandled Conekta event type: ${event.type}`);
  }

  // Acknowledge receipt of the event to Conekta.
  return NextResponse.json({ received: true });
}
