
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';
import { provisionSmsActivateNumberForUser } from '@/services/userSubscriptionService';
import { cancelActivation } from '@/services/vonage';
import { DEFAULT_FREE_PLAN_PHONE_NUMBER, DEFAULT_ASSISTANTS_LIMIT_FOR_FREE_PLAN, subscriptionPlansConfig } from '@/config/appConfig';


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
              : JSON.parse(rawBody) as Stripe.Event; 
      if (!STRIPE_WEBHOOK_SIGNING_SECRET && process.env.NODE_ENV !== 'development') {
          console.warn('Processed Stripe event without signature verification. THIS IS A SECURITY RISK IN PRODUCTION.');
      }
    } catch (err: any) {
      console.error(`Stripe webhook signature verification or parsing failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`Received Stripe event: ${event.type}, ID: ${event.id}`);
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    
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
          
          shouldProvisionNumber = true; 
          console.log(`Processing checkout.session.completed for firebaseUid: ${firebaseUid}, stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${stripeSubscriptionId}, planId: ${planIdFromStripe}`);
      } else { 
          const invoice = event.data.object as Stripe.Invoice;
          stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
          stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
          planIdFromStripe = invoice.lines?.data[0]?.price?.product_metadata?.planId || invoice.subscription_details?.metadata?.planId || null;
          
          if (!stripeCustomerId) {
              console.error('Stripe invoice.paid event missing customer ID.');
              return NextResponse.json({ error: 'Webhook Error: Missing customer ID for invoice.paid event.' }, { status: 400 });
          }
          console.log(`Processing invoice.paid for stripeCustomerId: ${stripeCustomerId}, subscriptionId: ${stripeSubscriptionId}, billing_reason: ${invoice.billing_reason}, planId: ${planIdFromStripe}`);

          const userProfileByStripeId = await userProfileCollection.findOne({ stripeCustomerId });
          if (userProfileByStripeId) {
              firebaseUid = userProfileByStripeId.firebaseUid;
              
              if ((invoice.billing_reason === 'subscription_create' || invoice.subscription_details?.metadata?.is_first_invoice === 'true') && !userProfileByStripeId.virtualPhoneNumber) {
                  shouldProvisionNumber = true;
              } else if (userProfileByStripeId.virtualPhoneNumber && userProfileByStripeId.numberActivationStatus !== 'active') {
                  console.log(`User ${firebaseUid} payment successful, reactivating number status. Plan: ${planIdFromStripe || 'N/A'}.`);
                  await userProfileCollection.updateOne(
                      { firebaseUid: firebaseUid },
                      { $set: { 
                          numberActivationStatus: 'active', 
                          ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }),
                          ...(planIdFromStripe && { currentPlan: planIdFromStripe as any}) 
                        } 
                      }
                  );
              } else {
                  console.log(`User ${firebaseUid} regular renewal. Updating plan to ${planIdFromStripe || 'N/A'}.`);
                  await userProfileCollection.updateOne(
                      { firebaseUid: firebaseUid },
                      { $set: { 
                          ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }),
                          ...(planIdFromStripe && { currentPlan: planIdFromStripe as any}) 
                        } 
                      }
                  );
              }
          } else {
              console.warn(`Could not find user profile by stripeCustomerId: ${stripeCustomerId} for invoice.paid event.`);
              if (invoice.billing_reason === 'subscription_create' || invoice.subscription_details?.metadata?.is_first_invoice === 'true') {
                   firebaseUid = (invoice.customer_details?.metadata?.firebaseUid || (event.data.object as any)?.metadata?.firebaseUid);
                   if (firebaseUid) {
                     console.log(`Determined firebaseUid: ${firebaseUid} from invoice metadata for new subscription.`);
                     shouldProvisionNumber = true;
                   } else {
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

          try { 
              const existingProfile = await userProfileCollection.findOne({ firebaseUid });
              if (existingProfile && existingProfile.virtualPhoneNumber) {
                  console.log(`User ${firebaseUid} already has a virtual number: ${existingProfile.virtualPhoneNumber}. Ensuring status is active and plan is updated.`);
                   await userProfileCollection.updateOne(
                      { firebaseUid: firebaseUid },
                      { $set: { 
                          numberActivationStatus: 'active', 
                          ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }), 
                          ...(stripeCustomerId && { stripeCustomerId: stripeCustomerId }),
                          ...(planIdFromStripe && { currentPlan: planIdFromStripe as any}) 
                        } 
                      }
                  );
                  return NextResponse.json({ received: true, message: 'User already has a virtual number. Status ensured to active. Plan updated.' }, { status: 200 });
              }
          } catch (dbError: any) {
              console.error(`Error checking existing profile for ${firebaseUid}:`, dbError.message, dbError.stack);
          }

          console.log(`Attempting to provision SMS-Activate number for user ${firebaseUid}, stripeCustomerId: ${stripeCustomerId}, planId: ${planIdFromStripe}`);
          const provisionSuccess = await provisionSmsActivateNumberForUser(firebaseUid, stripeCustomerId, stripeSubscriptionId, planIdFromStripe as any);
          if (provisionSuccess) {
            console.log(`Virtual number provisioned successfully for ${firebaseUid}.`);
            return NextResponse.json({ received: true, message: 'Virtual number provisioned successfully. Plan updated if provided.' }, { status: 200 });
          } else {
            console.error(`Failed to provision virtual number for firebaseUid: ${firebaseUid} after ${event.type}.`);
            return NextResponse.json({ received: true, error: 'Processed, but failed to provision virtual number fully.' }, { status: 200 });
          }
      } else if (firebaseUid && stripeCustomerId) { 
          console.log(`Processing renewal or existing user update for ${firebaseUid}. Setting numberActivationStatus to active and updating plan to ${planIdFromStripe || 'N/A'}.`);
          const customerEmail = (event.data.object as any)?.customer_email || (event.data.object as any)?.customer_details?.email || '';

          await userProfileCollection.updateOne(
              { firebaseUid: firebaseUid },
              { 
                $set: { 
                  numberActivationStatus: 'active', 
                  stripeCustomerId: stripeCustomerId, 
                  ...(stripeSubscriptionId && { stripeSubscriptionId: stripeSubscriptionId }),
                  ...(planIdFromStripe && { currentPlan: planIdFromStripe as any})  
                },
                $setOnInsert: { 
                  email: customerEmail, 
                  isAuthenticated: true, 
                  assistants: [],
                  databases: [],
                }
              },
              { upsert: true } 
          );
          console.log(`User ${firebaseUid} payment successful for existing subscription. Number status active. Plan updated to ${planIdFromStripe || 'N/A'}.`);
          return NextResponse.json({ received: true, message: 'Payment successful for existing subscription. Plan updated.' }, { status: 200 });
      } else {
          console.log(`Event ${event.type} processed, but no specific action to provision number or update active status. Missing firebaseUid/stripeCustomerId or handled previously.`);
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
        const userProfile = await userProfileCollection.findOne({ stripeCustomerId });
        if (userProfile && userProfile.virtualPhoneNumber && userProfile.numberActivationStatus === 'active') {
          if (userProfile.stripeSubscriptionId && invoice.subscription === userProfile.stripeSubscriptionId) {
              console.log(`Payment failed for user ${userProfile.firebaseUid}. Marking number ${userProfile.virtualPhoneNumber} for pending_cancellation.`);
              await userProfileCollection.updateOne(
                { stripeCustomerId: stripeCustomerId },
                { $set: { numberActivationStatus: 'pending_cancellation' } }
              );
              console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) number ${userProfile.virtualPhoneNumber} marked for pending_cancellation.`);
          } else {
              console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) payment failed, but invoice subscription ${invoice.subscription} does not match active user subscription ${userProfile.stripeSubscriptionId}. No action on number status.`);
          }
        } else if (userProfile) {
          console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) payment failed, but no active number or status not 'active'. Current status: ${userProfile.numberActivationStatus}`);
        } else {
          console.warn(`Received invoice.payment_failed for unknown stripeCustomerId: ${stripeCustomerId}.`);
        }
      } catch (dbError: any) {
        console.error(`Error processing invoice.payment_failed for stripeCustomerId ${stripeCustomerId}:`, dbError.message, dbError.stack);
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
          const userProfile = await userProfileCollection.findOne({ stripeCustomerId: stripeCustomerId });
          if (userProfile) {
              console.log(`Subscription ${subscription.id} cancelled for user ${userProfile.firebaseUid}. Current plan: ${userProfile.currentPlan}.`);
              
              if(userProfile.numberActivationId) {
                  console.log(`Attempting to cancel SMS-Activate activation ID: ${userProfile.numberActivationId}`);
                  const cancelled = await cancelActivation(userProfile.numberActivationId);
                  if(cancelled) {
                      console.log(`Successfully cancelled activation ${userProfile.numberActivationId} for user ${userProfile.firebaseUid}.`);
                  } else {
                      console.error(`Failed to cancel activation ${userProfile.numberActivationId} for user ${userProfile.firebaseUid}.`);
                  }
              }

              const updates: Partial<UserProfile> = {
                currentPlan: 'free', // Downgrade to free plan
                numberActivationStatus: 'cancelled',
                stripeSubscriptionId: undefined,
                virtualPhoneNumber: undefined,
                numberActivationId: undefined,
                numberCountryCode: undefined,
              };

              // Reconcile assistants: keep only the oldest and update its phone number
              if (userProfile.assistants && userProfile.assistants.length > 0) {
                const sortedAssistants = [...userProfile.assistants].sort((a, b) => {
                  // Assuming IDs are like 'asst_timestamp_random'
                  const timeA = parseInt(a.id.split('_')[1] || "0");
                  const timeB = parseInt(b.id.split('_')[1] || "0");
                  return timeA - timeB;
                });
                
                const oldestAssistant = sortedAssistants[0];
                oldestAssistant.phoneLinked = DEFAULT_FREE_PLAN_PHONE_NUMBER; // Assign default free plan number
                
                updates.assistants = [oldestAssistant].map(asst => ({
                    ...asst,
                    purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || new Set())
                }));
                console.log(`User ${userProfile.firebaseUid} downgraded to free plan. Oldest assistant ${oldestAssistant.id} kept and updated. Other assistants removed.`);
              } else {
                updates.assistants = []; // No assistants to keep or user had none
                 console.log(`User ${userProfile.firebaseUid} downgraded to free plan. No assistants were present or kept.`);
              }

              await userProfileCollection.updateOne(
                  { _id: userProfile._id }, 
                  { $set: updates }
              );
              console.log(`User ${userProfile.firebaseUid} (Stripe ID: ${stripeCustomerId}) profile updated. Plan set to free, number cancelled, assistants reconciled.`);

          } else {
              console.warn(`Received customer.subscription.deleted for stripeCustomerId: ${stripeCustomerId} and subscriptionId: ${subscription.id}, but no matching profile found.`);
          }
      } catch (dbError: any) {
          console.error(`Error processing customer.subscription.deleted for stripeCustomerId ${stripeCustomerId}:`, dbError.message, dbError.stack);
          return NextResponse.json({ error: 'Database operation failed during subscription_deleted processing.' }, { status: 500 });
      }
      return NextResponse.json({ received: true, message: 'Subscription deletion processed and user downgraded.' }, { status: 200 });
    } else {
      console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, message: "Event processed." }, { status: 200 });

  } catch (error: any) {
    console.error("Unhandled error in Stripe webhook handler:", error.message, error.stack);
    return NextResponse.json({ error: "An unexpected error occurred while processing the webhook.", details: error.message }, { status: 500 });
  }
}
