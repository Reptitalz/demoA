
import type { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import { searchAvailableNumber, buyNumber } from '@/services/vonage';
import type { UserProfile, AssistantConfig } from '@/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SIGNING_SECRET = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

if (!STRIPE_SECRET_KEY) {
  console.error('Stripe Secret Key is not defined in environment variables.');
}
if (!STRIPE_WEBHOOK_SIGNING_SECRET) {
  console.warn('Stripe Webhook Signing Secret is not defined. Webhook verification will fail.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
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
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ firebaseUid: firebaseUid });

    let updatedAssistantsArray: AssistantConfig[] = userProfile?.assistants || [];
    let numberAssignedToAnAssistant = false;

    if (userProfile && userProfile.assistants && userProfile.assistants.length > 0) {
      const firstUnassignedAssistantIndex = userProfile.assistants.findIndex(a => !a.phoneLinked);
      if (firstUnassignedAssistantIndex !== -1) {
        updatedAssistantsArray = userProfile.assistants.map((asst, index) => {
          if (index === firstUnassignedAssistantIndex) {
            console.log(`Assigning Vonage number ${availableNumber} to assistant ID ${asst.id} for user ${firebaseUid}`);
            return { ...asst, phoneLinked: availableNumber };
          }
          return asst;
        });
        numberAssignedToAnAssistant = true;
      } else {
        console.log(`User ${firebaseUid} has assistants, but all already have a phoneLinked. Vonage number ${availableNumber} will be stored on profile only for now.`);
      }
    } else {
        console.log(`User ${firebaseUid} has no assistants. Vonage number ${availableNumber} will be stored on profile only for now.`);
    }

    // Ensure purposes are arrays for MongoDB storage
    const assistantsToSave = updatedAssistantsArray.map(asst => ({
        ...asst,
        purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
    }));

    const updateOperation: any = {
      $set: {
        virtualPhoneNumber: availableNumber,
        stripeCustomerId: stripeCustomerId,
        assistants: assistantsToSave, // Always set the assistants array, even if unchanged, to ensure consistency
      },
      $setOnInsert: {
        email: userProfile?.email || '', // Try to preserve email if profile exists, otherwise empty
        isAuthenticated: true,
        currentPlan: userProfile?.currentPlan || null, // Try to preserve plan
        databases: userProfile?.databases || [],
        // assistants array is handled by $set to include the newly assigned number
      }
    };
    
    // If it's an upsert and the profile is new, $setOnInsert should define assistants if not being set by $set
    if (!userProfile) { // This means it's an insert operation by upsert
        updateOperation.$setOnInsert.assistants = assistantsToSave.length > 0 ? assistantsToSave : [];
    }


    const result = await db.collection<UserProfile>('userProfiles').updateOne(
      { firebaseUid: firebaseUid },
      updateOperation,
      { upsert: true }
    );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log(`Successfully assigned virtual number ${availableNumber} to user ${firebaseUid} and updated/created profile. Number assigned to an assistant: ${numberAssignedToAnAssistant}`);
      return true;
    } else {
      console.warn(`Profile for user ${firebaseUid} found but not modified, or no profile upserted after number assignment.`);
      return true; // Still return true if number was bought, even if DB state didn't change.
    }
  } catch (error) {
    console.error(`Error updating user profile for ${firebaseUid} with virtual number:`, error);
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

  if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
    let firebaseUid: string | undefined;
    let stripeCustomerId: string | undefined;
    let isNewSubscription = false;

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        firebaseUid = session.client_reference_id || undefined;
        stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        isNewSubscription = true; // checkout.session.completed typically means a new subscription or one-time purchase
        console.log(`Processing checkout.session.completed for firebaseUid: ${firebaseUid}, stripeCustomerId: ${stripeCustomerId}`);
    } else { // invoice.paid
        const invoice = event.data.object as Stripe.Invoice;
        stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        // For invoice.paid, especially for recurring payments, we might only assign a number if it's the first invoice.
        // If `billing_reason` is `subscription_create` or `subscription_cycle`
        isNewSubscription = invoice.billing_reason === 'subscription_create' || (invoice.subscription_details?.metadata?.is_first_invoice === 'true');


        if (!stripeCustomerId) {
            console.error('Stripe invoice.paid event missing customer ID.');
            return new Response('Webhook Error: Missing customer ID.', { status: 400 });
        }
        console.log(`Processing invoice.paid for stripeCustomerId: ${stripeCustomerId}, billing_reason: ${invoice.billing_reason}`);

        try {
            const { db } = await connectToDatabase();
            const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId });
            if (userProfile && userProfile.firebaseUid) {
                firebaseUid = userProfile.firebaseUid;
            } else {
                console.warn(`Could not find user profile by stripeCustomerId: ${stripeCustomerId} for invoice.paid event.`);
                 // If it's not a new subscription type of invoice, and we can't find the user, don't assign number
                if (!isNewSubscription) {
                    return new Response(JSON.stringify({ received: true, message: 'User profile not found for Stripe customer ID, and not a new subscription invoice.' }), { status: 200 });
                }
                // If it IS a new subscription invoice but we can't find user by stripeId, it's an issue.
                // This scenario is less likely if client_reference_id was used for checkout.session.completed.
                // For now, we will let it proceed if isNewSubscription is true and hope firebaseUid might come from customer metadata if set.
                // A more robust solution would be to ensure firebaseUid is in Stripe customer metadata.
                firebaseUid = invoice.customer_details?.metadata?.firebaseUid || (event.data.object as any)?.metadata?.firebaseUid; // Try to get from metadata
                 if (!firebaseUid) {
                    console.error(`Critical: invoice.paid for new subscription but could not determine firebaseUid for stripeCustomerId: ${stripeCustomerId}`);
                    return new Response('Webhook Error: Could not determine firebaseUid for new subscription.', { status: 400 });
                }
            }
        } catch (dbError) {
            console.error(`Database error looking up user by stripeCustomerId ${stripeCustomerId}:`, dbError);
            return new Response('Webhook Error: Database lookup failed.', { status: 500 });
        }
    }

    if (!firebaseUid) {
      console.error(`Stripe event ${event.type} missing client_reference_id (firebaseUid) or could not be determined.`);
      return new Response('Webhook Error: Missing client_reference_id.', { status: 400 });
    }
    if (!stripeCustomerId) {
      console.error(`Stripe event ${event.type} missing customer ID.`);
      return new Response('Webhook Error: Missing customer ID.', { status: 400 });
    }
    
    // Only proceed to assign a number if it's considered a new subscription/payment that warrants it.
    if (!isNewSubscription && event.type === 'invoice.paid') {
        console.log(`Invoice ${event.data.object.id} for ${stripeCustomerId} is not for a new subscription, skipping Vonage number assignment.`);
        return new Response(JSON.stringify({ received: true, message: 'Not a new subscription invoice, skipping number assignment.' }), { status: 200 });
    }


    try {
        const { db } = await connectToDatabase();
        const existingProfile = await db.collection<UserProfile>('userProfiles').findOne({ firebaseUid });
        if (existingProfile && existingProfile.virtualPhoneNumber) {
            console.log(`User ${firebaseUid} already has a virtual number: ${existingProfile.virtualPhoneNumber}. Skipping assignment.`);
            return new Response(JSON.stringify({ received: true, message: 'User already has a virtual number.' }), { status: 200 });
        }
    } catch (dbError) {
        console.error(`Error checking existing profile for ${firebaseUid}:`, dbError);
    }

    const success = await assignAndStoreVirtualNumber(firebaseUid, stripeCustomerId);

    if (success) {
      return new Response(JSON.stringify({ received: true, message: 'Virtual number assigned successfully.' }), { status: 200 });
    } else {
      console.error(`Failed to assign virtual number for firebaseUid: ${firebaseUid} after ${event.type}.`);
      return new Response(JSON.stringify({ received: true, message: 'Processed, but failed to assign virtual number fully.' }), { status: 200 });
    }
  } else {
    console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

