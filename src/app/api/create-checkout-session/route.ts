
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/mongodb';
import { subscriptionPlansConfig } from '@/config/appConfig';
import type { UserProfile } from '@/types';

// Hardcode the test key provided by the user to ensure test mode works.
const STRIPE_TEST_SECRET_KEY = 'sk_test_51NGmAyBwdSNcDr02417QVOTCSX6k9vyL30pdwZB6sCS73kG9czW62GYi5apNSv8ypIpwYdktZHIQ9zartOlnfa8p00NcJ0EyJv';
const STRIPE_LIVE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyFirebaseToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const firebaseUid = decodedToken.uid;

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const planDetails = subscriptionPlansConfig.find(p => p.id === planId);
    if (!planDetails || !planDetails.stripePriceId) {
      return NextResponse.json({ error: 'Invalid or un-purchasable plan ID' }, { status: 400 });
    }
    
    // Logic to select the correct Stripe key based on the price ID
    let stripeKey;
    const testPriceIds = ["price_1RRGyHBwdSNcDr02a7oH7iNc"]; // Known test price IDs
    
    if (testPriceIds.includes(planDetails.stripePriceId)) {
        // This is a test purchase, use the test key.
        stripeKey = STRIPE_TEST_SECRET_KEY;
        console.log("Using Stripe test key for test price ID.");
    } else {
        // This is a live purchase, use the live key from env vars.
        stripeKey = STRIPE_LIVE_SECRET_KEY;
        console.log("Using Stripe live key.");
    }

    if (!stripeKey) {
      const errorMessage = testPriceIds.includes(planDetails.stripePriceId)
        ? 'Stripe test secret key is not available.'
        : 'Stripe live secret key is not defined in environment variables.';
      throw new Error(errorMessage);
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
    });

    const { db } = await connectToDatabase();
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne({ firebaseUid });

    let stripeCustomerId = userProfile?.stripeCustomerId;

    // Create Stripe customer if one doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: decodedToken.email,
        name: decodedToken.name,
        metadata: {
          firebaseUid: firebaseUid,
        },
      });
      stripeCustomerId = customer.id;
      // Update our database with the new Stripe customer ID
      await db.collection('userProfiles').updateOne(
        { firebaseUid },
        { $set: { stripeCustomerId: stripeCustomerId } },
        { upsert: true }
      );
    }
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: planDetails.stripePriceId,
          quantity: 1,
        },
      ],
      // Important: Pass the firebaseUid so we know who to update on webhook success
      client_reference_id: firebaseUid,
      subscription_data: {
          metadata: {
              firebaseUid: firebaseUid,
              planId: planId
          }
      },
      success_url: `${BASE_URL}/app/dashboard?payment=success`,
      cancel_url: `${BASE_URL}/app/dashboard?payment=cancelled`,
    });

    if (!session.url) {
        throw new Error('Stripe session URL not found');
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
