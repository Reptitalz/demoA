
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';
import { provisionVonageNumberForUser } from '@/services/userSubscriptionService';
import { cancelNumber as cancelVonageNumber } from '@/services/vonage';


const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SIGNING_SECRET = process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

let stripe: Stripe;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
} else {
  console.error('Stripe Secret Key (STRIPE_SECRET_KEY) is not defined in environment variables. Stripe webhook handler will not function.');
}

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_SECRET_KEY) {
      console.error('Stripe Secret Key (STRIPE_SECRET_KEY) is not defined. Stripe webhook handler cannot function.');
      return NextResponse.json({ error: 'Server configuration issue (Missing Stripe Secret Key).' }, { status: 500 });
    }
    if (!stripe) {
        console.error('Stripe client not initialized due to missing STRIPE_SECRET_KEY.');
        return NextResponse.json({ error: 'Server configuration issue (Stripe client not initialized).' }, { status: 500 });
    }
    // It's important to have STRIPE_WEBHOOK_SIGNING_SECRET in production.
    // For local development, you might temporarily bypass signature verification if using Stripe CLI or similar,
    // but this should NOT be done in production.
    if (!STRIPE_WEBHOOK_SIGNING_SECRET && process.env.NODE_ENV === 'production') {
        console.error('Stripe Webhook Signing Secret (STRIPE_WEBHOOK_SIGNING_SECRET) is not defined. This is a critical security risk in production.');
        return NextResponse.json({ error: 'Server configuration issue (Missing Webhook Signing Secret).' }, { status: 500 });
    }


    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature && STRIPE_WEBHOOK_SIGNING_SECRET) {
      console.warn('Stripe webhook request missing signature.');
      return NextResponse.json({ error: 'Webhook Error: Missing signature.' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = STRIPE_WEBHOOK_SIGNING_SECRET && signature
              ? stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SIGNING_SECRET)
              : JSON.parse(rawBody) as Stripe.Event; // Fallback if no signing secret (dev only - CAUTION)
      if (!STRIPE_WEBHOOK_SIGNING_SECRET && process.env.NODE_ENV !== 'development') {
          console.warn('Processed Stripe event without signature verification. THIS IS A SECURITY RISK IN PRODUCTION.');
      }
    } catch (err: any) {
      console.error(`Stripe webhook signature verification or parsing failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`Received Stripe event: ${event.type}, ID: ${event.id}`);
    const { db } = await connectToDatabase();

    // --- Handle successful payment and number provisioning ---
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
      let firebaseUid: string | undefined;
      let stripeCustomerId: string | undefined;
      let stripeSubscriptionId: string | undefined;
      let shouldProvisionNumber = false;
      let planIdFromStripe: string | null = null;

      if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;
          firebaseUid = session.client_reference_id || undefined;
          stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
          stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
          planIdFromStripe = session.line_items?.data[0]?.price?.product_metadata?.planId || session.metadata?.planId || null;
          
          // Provision number if it's a checkout session completion (implies new subscription or item)
          shouldProvisionNumber = true; 
          console.log(`Processing checkout.session.completed for firebaseUid: ${firebaseUid}, stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${stripeSubscriptionId}, planId: ${planIdFromStripe}`);
      } else { // invoice.paid
          const invoice = event.data.object as Stripe.Invoice;
          stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
          stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
          planIdFromStripe = invoice.lines?.data[0]?.price?.product_metadata?.planId || invoice.subscription_details?.metadata?.planId || null;
          
          if (!stripeCustomerId) {
              console.error('Stripe invoice.paid event missing customer ID.');
              return NextResponse.json({ error: 'Webhook Error: Missing customer ID for invoice.paid event.' }, { status: 400 });
          }
          console.log(`Processing invoice.paid for stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${stripeSubscriptionId}, billing_reason: ${invoice.billing_reason}, planId: ${planIdFromStripe}`);

          const userProfileByStripeId = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId });
          if (userProfileByStripeId) {
              firebaseUid = userProfileByStripeId.firebaseUid;
              // Provision number if it's the first invoice for a subscription and user doesn't have a number
              if ((invoice.billing_reason === 'subscription_create' || invoice.subscription_details?.metadata?.is_first_invoice === 'true') && !userProfileByStripeId.virtualPhoneNumber) {
                  shouldProvisionNumber = true;
              } else if (userProfileByStripeId.virtualPhoneNumber && userProfileByStripeId.vonageNumberStatus !== 'active') {
                  // Reactivate number if payment is successful for an existing number not active
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
              // If it's a new subscription but profile doesn't exist by stripeCustomerId yet, try to get firebaseUid from metadata
              if (invoice.billing_reason === 'subscription_create' || invoice.subscription_details?.metadata?.is_first_invoice === 'true') {
                   firebaseUid = (invoice.customer_details?.metadata?.firebaseUid || (event.data.object as any)?.metadata?.firebaseUid);
                   if (firebaseUid) shouldProvisionNumber = true;
                   else {
                      console.error(`Critical: invoice.paid for new subscription but could not determine firebaseUid for stripeCustomerId: ${stripeCustomerId}`);
                   }
              }
          }
      }

      if (shouldProvisionNumber) {
          if (!firebaseUid) {
            console.error(`Stripe event ${event.type} missing client_reference_id (firebaseUid) or could not be determined.`);
            return NextResponse.json({ error: 'Webhook Error: Missing client_reference_id.' }, { status: 400 });
          }
          if (!stripeCustomerId) {
            console.error(`Stripe event ${event.type} missing customer ID.`);
            return NextResponse.json({ error: 'Webhook Error: Missing customer ID.' }, { status: 400 });
          }

          try { // Check if user already has a number before provisioning
              const existingProfile = await db.collection<UserProfile>('userProfiles').findOne({ firebaseUid });
              if (existingProfile && existingProfile.virtualPhoneNumber) {
                  console.log(`User ${firebaseUid} already has a virtual number: ${existingProfile.virtualPhoneNumber}. Ensuring status is active and plan is updated.`);
                   await db.collection<UserProfile>('userProfiles').updateOne(
                      { firebaseUid: firebaseUid },
                      { $set: { 
                          vonageNumberStatus: 'active', 
                          ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }), 
                          ...(stripeCustomerId && { stripeCustomerId: stripeCustomerId }), // ensure stripeCustomerId is set
                          ...(planIdFromStripe && { currentPlan: planIdFromStripe as any}) 
                        } 
                      }
                  );
                  return NextResponse.json({ received: true, message: 'User already has a virtual number. Status ensured to active. Plan updated.' }, { status: 200 });
              }
          } catch (dbError: any) {
              console.error(`Error checking existing profile for ${firebaseUid}:`, dbError.message);
              // Continue to attempt assignment if check fails, as it's better to assign than miss.
          }

          const provisionSuccess = await provisionVonageNumberForUser(firebaseUid, stripeCustomerId, stripeSubscriptionId, planIdFromStripe as any);
          if (provisionSuccess) {
            return NextResponse.json({ received: true, message: 'Virtual number provisioned successfully. Plan updated if provided.' }, { status: 200 });
          } else {
            console.error(`Failed to provision virtual number for firebaseUid: ${firebaseUid} after ${event.type}.`);
            // Still return 200 to Stripe to acknowledge receipt, but log the failure.
            return NextResponse.json({ received: true, error: 'Processed, but failed to provision virtual number fully.' }, { status: 200 });
          }
      } else if (firebaseUid && stripeCustomerId) { 
          // This case handles renewals where no new number is provisioned but profile needs update
          await db.collection<UserProfile>('userProfiles').updateOne(
              { firebaseUid: firebaseUid },
              { 
                $set: { 
                  vonageNumberStatus: 'active', 
                  stripeCustomerId: stripeCustomerId, 
                  ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }),
                  ...(planIdFromStripe && { currentPlan: planIdFromStripe as any})  
                },
                $setOnInsert: { // In case profile was somehow missed earlier
                  email: (event.data.object as any)?.customer_details?.email || '', 
                  isAuthenticated: true, // Assume true if they have a paid event
                }
              },
              { upsert: true } 
          );
          console.log(`User ${firebaseUid} payment successful for existing subscription. Vonage number status active. Plan updated to ${planIdFromStripe || 'N/A'}.`);
          return NextResponse.json({ received: true, message: 'Payment successful for existing subscription. Plan updated.' }, { status: 200 });
      } else {
          console.log(`Event ${event.type} processed, but no specific action taken to provision number or update active status for a user. This might be a regular renewal already handled.`);
      }

    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

      if (!stripeCustomerId) {
        console.error('Stripe invoice.payment_failed event missing customer ID.');
        return NextResponse.json({ error: 'Webhook Error: Missing customer ID for payment_failed event.' }, { status: 400 });
      }
      console.log(`Processing invoice.payment_failed for stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${invoice.subscription}`);

      try {
        const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId });
        if (userProfile && userProfile.virtualPhoneNumber && userProfile.vonageNumberStatus === 'active') {
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
      } catch (dbError: any) {
        console.error(`Error processing invoice.payment_failed for stripeCustomerId ${stripeCustomerId}:`, dbError.message);
        return NextResponse.json({ error: 'Database operation failed during payment_failed processing.' }, { status: 500 });
      }
      return NextResponse.json({ received: true, message: 'Payment failure processed.' }, { status: 200 });
   
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      
      if (!stripeCustomerId) {
          console.error('Stripe customer.subscription.deleted event missing customer ID.');
          return NextResponse.json({ error: 'Webhook Error: Missing customer ID for subscription_deleted event.' }, { status: 400 });
      }
      console.log(`Processing customer.subscription.deleted for stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${subscription.id}`);

      try {
          const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ stripeCustomerId: stripeCustomerId, stripeSubscriptionId: subscription.id });
          if (userProfile && userProfile.virtualPhoneNumber && userProfile.vonageNumberStatus === 'active') {
              // Consider if number should be cancelled immediately or marked for pending. For now, mark as pending.
              // A cron job would then actually cancel it with Vonage.
              await db.collection<UserProfile>('userProfiles').updateOne(
                  { _id: userProfile._id }, 
                  { $set: { vonageNumberStatus: 'pending_cancellation', currentPlan: null } } // Set plan to null or free tier
              );
              console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) subscription ${subscription.id} cancelled. Vonage number ${userProfile.virtualPhoneNumber} marked for pending_cancellation. Plan set to null.`);
              
              // Optional: Immediately attempt to cancel Vonage number if desired, though usually done by cron
              // if (userProfile.countryCodeForVonageNumber) { // Assuming you store this
              //    await cancelVonageNumber(userProfile.virtualPhoneNumber, userProfile.countryCodeForVonageNumber);
              // }

          } else if (userProfile) {
              console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) subscription ${subscription.id} cancelled, but no active Vonage number, status not 'active', or subscription ID mismatch. Current status: ${userProfile.vonageNumberStatus}, current sub: ${userProfile.stripeSubscriptionId}. Setting currentPlan to null.`);
              await db.collection<UserProfile>('userProfiles').updateOne(
                { _id: userProfile._id }, 
                { $set: { currentPlan: null } }
              );
          } else {
              console.warn(`Received customer.subscription.deleted for stripeCustomerId: ${stripeCustomerId} and subscriptionId: ${subscription.id}, but no matching profile found with this active subscription.`);
          }
      } catch (dbError: any) {
          console.error(`Error processing customer.subscription.deleted for stripeCustomerId ${stripeCustomerId}:`, dbError.message);
          return NextResponse.json({ error: 'Database operation failed during subscription_deleted processing.' }, { status: 500 });
      }
      return NextResponse.json({ received: true, message: 'Subscription deletion processed.' }, { status: 200 });
    } else {
      console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, message: "Event processed." }, { status: 200 });

  } catch (error: any) {
    // Catch-all for any unexpected errors during the webhook processing
    console.error("Unhandled error in Stripe webhook handler:", error.message, error.stack);
    return NextResponse.json({ error: "An unexpected error occurred while processing the webhook.", details: error.message }, { status: 500 });
  }
}
    

    