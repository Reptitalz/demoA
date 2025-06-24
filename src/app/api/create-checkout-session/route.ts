
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/mongodb';
import { subscriptionPlansConfig } from '@/config/appConfig';
import type { UserProfile } from '@/types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error('Stripe secret key is not defined in environment variables.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

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
