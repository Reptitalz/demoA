
import type { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import { searchAvailableNumber, buyNumber } from '@/services/vonage';
import type { UserProfile } from '@/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SIGNING_SECRET = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.error('Stripe Secret Key is not defined in environment variables.');
  // This will cause an error when trying to initialize Stripe
}
if (!STRIPE_WEBHOOK_SIGNING_SECRET) {
  console.warn('Stripe Webhook Signing Secret is not defined. Webhook verification will fail.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the latest API version
});

async function assignAndStoreVirtualNumber(firebaseUid: string, stripeCustomerId: string): Promise<boolean> {
  console.log(`Attempting to assign virtual number to user: ${firebaseUid}, Stripe Customer ID: ${stripeCustomerId}`);

  const availableNumber = await searchAvailableNumber('US');
  if (!availableNumber) {
    console.error(`No Vonage number available for user ${firebaseUid}.`);
    return false;
  }

  const bought = await buyNumber('US', availableNumber);
  if (!bought) {
    console.error(`Failed to buy Vonage number ${availableNumber} for user ${firebaseUid}.`);
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const result = await db.collection<UserProfile>('userProfiles').updateOne(
      { firebaseUid: firebaseUid },
      { 
        $set: { 
          virtualPhoneNumber: availableNumber,
          stripeCustomerId: stripeCustomerId 
        },
        $setOnInsert: { // Set these fields only if a new document is inserted
            email: '', // Placeholder, ideally fetched or known
            isAuthenticated: true, // Assuming authentication via Stripe implies this
            currentPlan: null, // Placeholder, plan info might come from Stripe event
            assistants: [],
            databases: [],
        }
      },
      { upsert: true } // Create profile if it doesn't exist
    );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log(`Successfully assigned virtual number ${availableNumber} to user ${firebaseUid} and updated/created profile.`);
      return true;
    } else {
      console.warn(`Profile for user ${firebaseUid} found but not modified, or no profile upserted after number assignment.`);
      // This could happen if the data was already set. Consider it a success if number was bought.
      return true;
    }
  } catch (error) {
    console.error(`Error updating user profile for ${firebaseUid} with virtual number:`, error);
    // Potentially, you might want to release the Vonage number if DB update fails.
    // This requires more complex rollback logic.
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!STRIPE_WEBHOOK_SIGNING_SECRET) {
    console.error('Stripe webhook signing secret is not configured. Denying request.');
    return new Response('Webhook Error: Server configuration issue.', { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.warn('Stripe webhook request missing signature.');
    return new Response('Webhook Error: Missing signature.', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SIGNING_SECRET);
  } catch (err: any) {
    console.error(`Stripe webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Received Stripe event: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const firebaseUid = session.client_reference_id; // Passed from frontend during checkout creation
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;


    if (!firebaseUid) {
      console.error('Stripe checkout.session.completed event missing client_reference_id (firebaseUid).');
      return new Response('Webhook Error: Missing client_reference_id.', { status: 400 });
    }
    if (!stripeCustomerId) {
      console.error('Stripe checkout.session.completed event missing customer ID.');
      return new Response('Webhook Error: Missing customer ID.', { status: 400 });
    }
    
    console.log(`Processing checkout.session.completed for firebaseUid: ${firebaseUid}, stripeCustomerId: ${stripeCustomerId}`);

    // Check if a number has already been assigned for this user to prevent duplicates on retries
    try {
        const { db } = await connectToDatabase();
        const existingProfile = await db.collection<UserProfile>('userProfiles').findOne({ firebaseUid });
        if (existingProfile && existingProfile.virtualPhoneNumber) {
            console.log(`User ${firebaseUid} already has a virtual number: ${existingProfile.virtualPhoneNumber}. Skipping assignment.`);
            return new Response(JSON.stringify({ received: true, message: 'User already has a virtual number.' }), { status: 200 });
        }
    } catch (dbError) {
        console.error(`Error checking existing profile for ${firebaseUid}:`, dbError);
        // Continue to attempt assignment, but log error
    }


    const success = await assignAndStoreVirtualNumber(firebaseUid, stripeCustomerId);

    if (success) {
      return new Response(JSON.stringify({ received: true, message: 'Virtual number assigned successfully.' }), { status: 200 });
    } else {
      console.error(`Failed to assign virtual number for firebaseUid: ${firebaseUid} after checkout.session.completed.`);
      // It's important to return 200 to Stripe if the event was received and processed,
      // even if our internal logic had an issue, to prevent Stripe from retrying indefinitely
      // for *this specific* error type. However, if it's a configuration or temporary issue,
      // a 500 might be appropriate to signal Stripe to retry.
      // For now, returning 200 but logging error.
      return new Response(JSON.stringify({ received: true, message: 'Processed, but failed to assign virtual number fully.' }), { status: 200 });
    }
  } else if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    // To get firebaseUid from invoice.paid, you'd typically need to:
    // 1. Store firebaseUid in Stripe customer metadata when the customer is created/subscription starts.
    // 2. Or, query your DB for a UserProfile that has this stripeCustomerId.
    // For this example, let's assume you can retrieve firebaseUid based on stripeCustomerId.
    // This part requires a lookup in your database.

    if (!stripeCustomerId) {
      console.error('Stripe invoice.paid event missing customer ID.');
      return new Response('Webhook Error: Missing customer ID.', { status: 400 });
    }
    
    console.log(`Processing invoice.paid for stripeCustomerId: ${stripeCustomerId}`);
    // Placeholder for fetching firebaseUid - this is crucial
    let firebaseUid: string | undefined; 
    try {
        const { db } = await connectToDatabase();
        const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId });
        if (userProfile && userProfile.firebaseUid) {
            firebaseUid = userProfile.firebaseUid;
            if (userProfile.virtualPhoneNumber) {
                 console.log(`User ${firebaseUid} (found by Stripe ID ${stripeCustomerId}) already has a virtual number: ${userProfile.virtualPhoneNumber}. Skipping assignment for invoice.paid.`);
                 return new Response(JSON.stringify({ received: true, message: 'User already has a virtual number.' }), { status: 200 });
            }
        } else {
            console.warn(`Could not find user profile by stripeCustomerId: ${stripeCustomerId} for invoice.paid event. Cannot assign number.`);
            return new Response(JSON.stringify({ received: true, message: 'User profile not found for Stripe customer ID.' }), { status: 200 });
        }
    } catch (dbError) {
        console.error(`Database error looking up user by stripeCustomerId ${stripeCustomerId}:`, dbError);
        return new Response('Webhook Error: Database lookup failed.', { status: 500 });
    }
    
    if (!firebaseUid) {
        // Should have been caught above, but as a safeguard
        return new Response('Webhook Error: Could not determine firebaseUid for Stripe customer.', { status: 400 });
    }

    const success = await assignAndStoreVirtualNumber(firebaseUid, stripeCustomerId);
     if (success) {
      return new Response(JSON.stringify({ received: true, message: 'Virtual number assigned successfully via invoice.paid.' }), { status: 200 });
    } else {
      console.error(`Failed to assign virtual number for firebaseUid: ${firebaseUid} after invoice.paid.`);
      return new Response(JSON.stringify({ received: true, message: 'Processed invoice.paid, but failed to assign virtual number fully.' }), { status: 200 });
    }

  } else {
    console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
