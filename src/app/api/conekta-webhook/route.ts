
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import axios from 'axios';

const CONEKTA_API_URL = 'https://api.conekta.io';
const CONEKTA_API_VERSION = '2.0.0';

export async function POST(request: NextRequest) {
  console.log("API ROUTE: /api/conekta-webhook (axios) reached.");
  
  const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;
  if (!CONEKTA_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set.");
    return NextResponse.json({ error: 'Webhook processor not configured.' }, { status: 500 });
  }

  let incomingEvent;
  try {
    incomingEvent = await request.json();
    if (!incomingEvent || !incomingEvent.id) {
      throw new Error("Event data or event ID is missing.");
    }
  } catch (error: any) {
    console.error('Webhook Error: Could not parse event body.', error.message);
    return NextResponse.json({ error: `Webhook error: Invalid JSON payload.` }, { status: 400 });
  }
  
  let verifiedEvent;
  try {
    // To ensure security, we fetch the event directly from Conekta's API
    // using the ID from the incoming webhook. This prevents payload tampering.
    console.log(`Verifying event ID ${incomingEvent.id} directly with Conekta API...`);
    const response = await axios.get(`${CONEKTA_API_URL}/webhooks/${incomingEvent.id}`, {
      headers: {
          'Accept': `application/vnd.conekta-v${CONEKTA_API_VERSION}+json`,
          'Authorization': `Bearer ${CONEKTA_PRIVATE_KEY}`
      }
    });
    verifiedEvent = response.data;
    console.log(`Conekta event ${verifiedEvent.id} verified successfully. Type: ${verifiedEvent.type}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.details?.[0]?.message || error.message;
    console.error(`Webhook event verification failed for ID ${incomingEvent.id}:`, errorMessage);
    console.error('Full Error Object:', JSON.stringify(error.response?.data || error, null, 2));
    return NextResponse.json({ error: `Webhook verification failed.` }, { status: 400 });
  }

  if (verifiedEvent.type === 'order.paid') {
    const order = verifiedEvent.data.object;
    console.log(`Processing 'order.paid' event for order ID: ${order.id}`);

    const firebaseUid = order.metadata?.firebaseUid;
    const creditsToAdd = order.metadata?.credits ? parseInt(order.metadata.credits, 10) : 0;

    if (!firebaseUid || !creditsToAdd) {
      console.error('Webhook for order.paid is missing metadata (firebaseUid or credits).', { orderId: order.id, metadata: order.metadata });
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
      } else {
        console.error(`CRITICAL: User with firebaseUid ${firebaseUid} not found. Could not add credits for order ${order.id}.`);
      }
    } catch (dbError: any) {
      console.error('Database error while processing webhook:', dbError);
      return NextResponse.json({ error: 'An internal database error occurred.' }, { status: 500 });
    }
  } else {
    console.log(`Received and acknowledged unhandled Conekta event type: ${verifiedEvent.type}`);
  }

  return NextResponse.json({ received: true });
}
