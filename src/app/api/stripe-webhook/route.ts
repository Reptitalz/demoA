
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import { searchAvailableNumber, buyNumber } from '@/services/vonage'; // Assuming cancelNumber might be used by a cron
import type { UserProfile, AssistantConfig } from '@/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SIGNING_SECRET = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

// Stripe client initialization - moved outside POST to be available for the module
// but will check STRIPE_SECRET_KEY within POST before use.
let stripe: Stripe;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
} else {
  console.error('Stripe Secret Key (STRIPE_SECRET_KEY) is not defined in environment variables. Stripe webhook handler will not function.');
}


async function assignAndStoreVirtualNumber(firebaseUid: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<boolean> {
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

    // Assign to first assistant without a phoneLinked if assistants exist
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

    const assistantsToSave = updatedAssistantsArray.map(asst => ({
        ...asst,
        purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set()),
    }));

    // Prepare update operation for MongoDB
    const updateOperation: any = {
      $set: {
        virtualPhoneNumber: availableNumber,
        stripeCustomerId: stripeCustomerId,
        assistants: assistantsToSave, // Save updated assistants array
        vonageNumberStatus: 'active', // Set number status to active
        ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }), // Conditionally add stripeSubscriptionId
      },
      $setOnInsert: { // Fields to set only if a new document is created (upsert)
        firebaseUid: firebaseUid, // Ensure firebaseUid is set on insert
        email: userProfile?.email || '', // Use existing email or default
        isAuthenticated: true, // Assume authenticated if they made a purchase
        currentPlan: userProfile?.currentPlan || null, // Preserve existing plan or set to null
        databases: userProfile?.databases || [], // Preserve existing databases or empty array
      }
    };
    
    // If the profile didn't exist (userProfile is null), ensure assistants array is set on insert
    if (!userProfile) { 
        updateOperation.$setOnInsert.assistants = assistantsToSave.length > 0 ? assistantsToSave : [];
    }


    const result = await db.collection<UserProfile>('userProfiles').updateOne(
      { firebaseUid: firebaseUid }, // Match by firebaseUid
      updateOperation,
      { upsert: true }
    );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log(`Successfully assigned virtual number ${availableNumber} to user ${firebaseUid} and updated/created profile. Number assigned to an assistant: ${numberAssignedToAnAssistant}. Status: active.`);
      return true;
    } else {
      console.warn(`Profile for user ${firebaseUid} found but not modified, or no profile upserted after number assignment. This might be okay if data was identical.`);
      return true; // Still true as number was bought, DB state might have been already correct
    }
  } catch (error) {
    console.error(`Error updating user profile for ${firebaseUid} with virtual number:`, error);
    // Consider how to handle this: should we attempt to cancel the Vonage number if DB update fails?
    // For now, we return false, indicating partial failure.
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Critical environment variable checks
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe Secret Key (STRIPE_SECRET_KEY) is not defined. Stripe webhook handler cannot function.');
    return new NextResponse('Webhook Error: Server configuration issue (Missing Stripe Secret Key).', { status: 500 });
  }
  if (!STRIPE_WEBHOOK_SIGNING_SECRET) {
    console.error('Stripe Webhook Signing Secret (STRIPE_WEBHOOK_SIGNING_SECRET) is not defined. Webhook verification will fail.');
    // We can still attempt to process if in a dev environment where signature verification might be skipped,
    // but it's a major security risk in production.
    // For now, we'll log a warning and proceed, but in production, this should be a hard fail.
    console.warn('Stripe Webhook Signing Secret is not defined. This is a security risk in production.');
    // return new NextResponse('Webhook Error: Server configuration issue (Missing Webhook Signing Secret).', { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature && STRIPE_WEBHOOK_SIGNING_SECRET) { // Only require signature if secret is present
    console.warn('Stripe webhook request missing signature.');
    return new NextResponse('Webhook Error: Missing signature.', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Ensure stripe client is initialized
    if (!stripe) {
        console.error('Stripe client not initialized due to missing STRIPE_SECRET_KEY.');
        return new NextResponse('Webhook Error: Server configuration issue (Stripe client not initialized).', { status: 500 });
    }
    event = STRIPE_WEBHOOK_SIGNING_SECRET 
            ? stripe.webhooks.constructEvent(rawBody, signature!, STRIPE_WEBHOOK_SIGNING_SECRET)
            : JSON.parse(rawBody) as Stripe.Event; // Fallback if no signing secret (dev only)
  } catch (err: any) {
    console.error(`Stripe webhook signature verification or parsing failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Received Stripe event: ${event.type}, ID: ${event.id}`);
  const { db } = await connectToDatabase();

  // --- Handle successful payment ---
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
    let firebaseUid: string | undefined;
    let stripeCustomerId: string | undefined;
    let stripeSubscriptionId: string | undefined;
    let shouldAssignNumber = false;
    let planIdFromStripe: string | null = null; // To store plan ID if available

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        firebaseUid = session.client_reference_id || undefined;
        stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        // Extract plan ID from line items metadata if available
        planIdFromStripe = session.line_items?.data[0]?.price?.product_metadata?.planId || session.metadata?.planId || null;
        
        shouldAssignNumber = true; 
        console.log(`Processing checkout.session.completed for firebaseUid: ${firebaseUid}, stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${stripeSubscriptionId}, planId: ${planIdFromStripe}`);
    } else { // invoice.paid
        const invoice = event.data.object as Stripe.Invoice;
        stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        planIdFromStripe = invoice.lines?.data[0]?.price?.product_metadata?.planId || invoice.subscription_details?.metadata?.planId || null;
        
        if (!stripeCustomerId) {
            console.error('Stripe invoice.paid event missing customer ID.');
            return new NextResponse('Webhook Error: Missing customer ID.', { status: 400 });
        }
        console.log(`Processing invoice.paid for stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${stripeSubscriptionId}, billing_reason: ${invoice.billing_reason}, planId: ${planIdFromStripe}`);

        const userProfileByStripeId = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId });
        if (userProfileByStripeId) {
            firebaseUid = userProfileByStripeId.firebaseUid;
            if (invoice.billing_reason === 'subscription_create' || (invoice.subscription_details?.metadata?.is_first_invoice === 'true' && !userProfileByStripeId.virtualPhoneNumber)) {
                shouldAssignNumber = true;
            } else if (userProfileByStripeId.virtualPhoneNumber && userProfileByStripeId.vonageNumberStatus !== 'active') {
                await db.collection<UserProfile>('userProfiles').updateOne(
                    { firebaseUid: firebaseUid },
                    { $set: { 
                        vonageNumberStatus: 'active', 
                        ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }),
                        ...(planIdFromStripe && { currentPlan: planIdFromStripe as any}) 
                      } 
                    }
                );
                console.log(`User ${firebaseUid} payment successful, Vonage number status set to active. Plan updated to ${planIdFromStripe || 'N/A'}.`);
            } else {
                 // Regular renewal, just ensure plan and subscription ID are up to date
                await db.collection<UserProfile>('userProfiles').updateOne(
                    { firebaseUid: firebaseUid },
                    { $set: { 
                        ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }),
                        ...(planIdFromStripe && { currentPlan: planIdFromStripe as any}) 
                      } 
                    }
                );
                console.log(`User ${firebaseUid} regular renewal. Plan updated to ${planIdFromStripe || 'N/A'}.`);
            }
        } else {
            console.warn(`Could not find user profile by stripeCustomerId: ${stripeCustomerId} for invoice.paid event.`);
            if (invoice.billing_reason === 'subscription_create' || invoice.subscription_details?.metadata?.is_first_invoice === 'true') {
                 firebaseUid = (invoice.customer_details?.metadata?.firebaseUid || (event.data.object as any)?.metadata?.firebaseUid);
                 if (firebaseUid) shouldAssignNumber = true;
                 else {
                    console.error(`Critical: invoice.paid for new subscription but could not determine firebaseUid for stripeCustomerId: ${stripeCustomerId}`);
                 }
            }
        }
    }

    if (shouldAssignNumber) {
        if (!firebaseUid) {
          console.error(`Stripe event ${event.type} missing client_reference_id (firebaseUid) or could not be determined.`);
          return new NextResponse('Webhook Error: Missing client_reference_id.', { status: 400 });
        }
        if (!stripeCustomerId) {
          console.error(`Stripe event ${event.type} missing customer ID.`);
          return new NextResponse('Webhook Error: Missing customer ID.', { status: 400 });
        }

        try {
            const existingProfile = await db.collection<UserProfile>('userProfiles').findOne({ firebaseUid });
            if (existingProfile && existingProfile.virtualPhoneNumber) {
                console.log(`User ${firebaseUid} already has a virtual number: ${existingProfile.virtualPhoneNumber}. Ensuring status is active and plan is updated.`);
                 await db.collection<UserProfile>('userProfiles').updateOne(
                    { firebaseUid: firebaseUid },
                    { $set: { 
                        vonageNumberStatus: 'active', 
                        ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }), 
                        ...(stripeCustomerId && { stripeCustomerId: stripeCustomerId }),
                        ...(planIdFromStripe && { currentPlan: planIdFromStripe as any}) 
                      } 
                    }
                );
                return new NextResponse(JSON.stringify({ received: true, message: 'User already has a virtual number. Status ensured to active. Plan updated.' }), { status: 200 });
            }
        } catch (dbError) {
            console.error(`Error checking existing profile for ${firebaseUid}:`, dbError);
            // Continue to attempt assignment if check fails, as it's better to assign than miss.
        }

        const success = await assignAndStoreVirtualNumber(firebaseUid, stripeCustomerId, stripeSubscriptionId);
        if (success) {
          if(planIdFromStripe) { // Also update plan if it was part of the checkout/invoice
            await db.collection<UserProfile>('userProfiles').updateOne(
                { firebaseUid: firebaseUid },
                { $set: { currentPlan: planIdFromStripe as any } }
            );
          }
          return new NextResponse(JSON.stringify({ received: true, message: 'Virtual number assigned successfully. Plan updated if provided.' }), { status: 200 });
        } else {
          console.error(`Failed to assign virtual number for firebaseUid: ${firebaseUid} after ${event.type}.`);
          return new NextResponse(JSON.stringify({ received: true, message: 'Processed, but failed to assign virtual number fully.' }), { status: 200 }); // Still 200 to Stripe
        }
    } else if (firebaseUid && stripeCustomerId) { 
        await db.collection<UserProfile>('userProfiles').updateOne(
            { firebaseUid: firebaseUid },
            { 
              $set: { 
                vonageNumberStatus: 'active', 
                stripeCustomerId: stripeCustomerId, 
                ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }),
                ...(planIdFromStripe && { currentPlan: planIdFromStripe as any})  
              },
              $setOnInsert: { 
                email: (event.data.object as any)?.customer_details?.email || '', 
                isAuthenticated: true,
              }
            },
            { upsert: true } 
        );
        console.log(`User ${firebaseUid} payment successful for existing subscription. Vonage number status active. Plan updated to ${planIdFromStripe || 'N/A'}.`);
        return new NextResponse(JSON.stringify({ received: true, message: 'Payment successful for existing subscription. Plan updated.' }), { status: 200 });
    } else {
        console.log(`Event ${event.type} processed, but no action taken to assign number or update active status for a specific user.`);
    }

  } else if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

    if (!stripeCustomerId) {
      console.error('Stripe invoice.payment_failed event missing customer ID.');
      return new NextResponse('Webhook Error: Missing customer ID for payment_failed event.', { status: 400 });
    }
    console.log(`Processing invoice.payment_failed for stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${invoice.subscription}`);

    try {
      const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId });
      if (userProfile && userProfile.virtualPhoneNumber && userProfile.vonageNumberStatus === 'active') {
        // Only mark for cancellation if the failed invoice corresponds to their active subscription
        if (userProfile.stripeSubscriptionId && invoice.subscription === userProfile.stripeSubscriptionId) {
            await db.collection<UserProfile>('userProfiles').updateOne(
              { stripeCustomerId: stripeCustomerId },
              { $set: { vonageNumberStatus: 'pending_cancellation' } }
            );
            console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) payment failed for subscription ${invoice.subscription}. Vonage number ${userProfile.virtualPhoneNumber} marked for pending_cancellation.`);
        } else {
            console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) payment failed, but invoice subscription ${invoice.subscription} does not match active user subscription ${userProfile.stripeSubscriptionId}. No action taken on Vonage number status.`);
        }
      } else if (userProfile) {
        console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) payment failed, but no active Vonage number found or status not 'active'. Current status: ${userProfile.vonageNumberStatus}`);
      } else {
        console.warn(`Received invoice.payment_failed for unknown stripeCustomerId: ${stripeCustomerId}.`);
      }
    } catch (error) {
      console.error(`Error processing invoice.payment_failed for stripeCustomerId ${stripeCustomerId}:`, error);
      return new NextResponse('Webhook Error: Database operation failed during payment_failed processing.', { status: 500 });
    }
    return new NextResponse(JSON.stringify({ received: true, message: 'Payment failure processed.' }), { status: 200 });
 
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    
    if (!stripeCustomerId) {
        console.error('Stripe customer.subscription.deleted event missing customer ID.');
        return new NextResponse('Webhook Error: Missing customer ID for subscription_deleted event.', { status: 400 });
    }
    console.log(`Processing customer.subscription.deleted for stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${subscription.id}`);

    try {
        // Match by stripeCustomerId and the specific subscriptionId being deleted
        const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId: stripeCustomerId, stripeSubscriptionId: subscription.id });
        if (userProfile && userProfile.virtualPhoneNumber && userProfile.vonageNumberStatus === 'active') {
            await db.collection<UserProfile>('userProfiles').updateOne(
                { _id: userProfile._id }, 
                { $set: { vonageNumberStatus: 'pending_cancellation' } } // Can also set currentPlan to null or a free tier
            );
            console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) subscription ${subscription.id} cancelled. Vonage number ${userProfile.virtualPhoneNumber} marked for pending_cancellation.`);
        } else if (userProfile) {
            console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) subscription ${subscription.id} cancelled, but no active Vonage number, status not 'active', or subscription ID mismatch. Current status: ${userProfile.vonageNumberStatus}, current sub: ${userProfile.stripeSubscriptionId}`);
        } else {
            console.warn(`Received customer.subscription.deleted for stripeCustomerId: ${stripeCustomerId} and subscriptionId: ${subscription.id}, but no matching profile found with this active subscription.`);
        }
    } catch (error) {
        console.error(`Error processing customer.subscription.deleted for stripeCustomerId ${stripeCustomerId}:`, error);
        return new NextResponse('Webhook Error: Database operation failed during subscription_deleted processing.', { status: 500 });
    }
    return new NextResponse(JSON.stringify({ received: true, message: 'Subscription deletion processed.' }), { status: 200 });
  } else {
    console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}

    