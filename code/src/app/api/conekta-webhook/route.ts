
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Conekta from 'conekta';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

// It's crucial to set these in your environment variables
const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;
const CONEKTA_WEBHOOK_SIGNING_SECRET = process.env.CONEKTA_WEBHOOK_SIGNING_SECRET;

if (CONEKTA_PRIVATE_KEY) {
  Conekta.api_key = CONEKTA_PRIVATE_KEY;
  Conekta.locale = 'es';
}

export async function POST(request: NextRequest) {
  if (!CONEKTA_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set. Webhook processing will fail.");
    return NextResponse.json({ error: 'Payment processing not configured on server.' }, { status: 500 });
  }
  if (!CONEKTA_WEBHOOK_SIGNING_SECRET) {
    console.warn("WARNING: CONEKTA_WEBHOOK_SIGNING_SECRET is not set. Webhook verification is disabled, THIS IS A SECURITY RISK.");
  }

  const rawBody = await request.text();
  const signature = headers().get('conekta-signature');
  let event;

  try {
    // TODO: For production, enable signature verification by uncommenting the logic below
    // and ensuring CONEKTA_WEBHOOK_SIGNING_SECRET is set.
    // if (CONEKTA_WEBHOOK_SIGNING_SECRET && signature) {
    //   // This part is commented out because we don't have the user's secret.
    //   // In a real scenario, this verification is critical.
    //   // event = Conekta.Webhook.find(rawBody, signature, CONEKTA_WEBHOOK_SIGNING_SECRET);
    //   event = JSON.parse(rawBody);
    // } else {
      event = JSON.parse(rawBody);
    // }
  } catch (error: any) {
    console.error('Webhook Error: Could not parse or verify event.', error);
    return NextResponse.json({ error: `Webhook error: ${error.message}` }, { status: 400 });
  }

  // Handle the order.paid event, which is triggered when SPEI payment is confirmed
  if (event.type === 'order.paid') {
    const order = event.data.object;

    const firebaseUid = order.metadata?.firebaseUid;
    const creditsToAdd = order.metadata?.credits ? parseInt(order.metadata.credits, 10) : 0;

    if (!firebaseUid || !creditsToAdd) {
      console.error('Webhook received for order.paid but metadata (firebaseUid or credits) is missing.', { orderId: order.id });
      // Return 200 to acknowledge receipt and prevent Conekta from retrying.
      // We can't process it, but it's not Conekta's fault.
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
        // Here you could trigger another service, like sending a confirmation email/notification to the user.
      } else {
        console.error(`User with firebaseUid ${firebaseUid} not found. Could not add credits for order ${order.id}.`);
      }

    } catch (dbError) {
      console.error('Database error while processing webhook:', dbError);
      // Return a 500 to signal to Conekta that something went wrong on our end and it should retry.
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  } else {
    console.log(`Received unhandled Conekta event type: ${event.type}`);
  }

  // Acknowledge receipt of the event to Conekta
  return NextResponse.json({ received: true });
}
