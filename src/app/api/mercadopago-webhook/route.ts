
// src/app/api/mercadopago-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { UserProfile } from '@/types';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// This is a simplified webhook handler. In production, you should
// verify the webhook signature from Mercado Pago for security.

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN!,
});
const payment = new Payment(client);

export async function POST(request: NextRequest) {
  console.log('--- Mercado Pago Webhook Received ---');
  try {
    const notification = await request.json();
    console.log('Notification body:', JSON.stringify(notification, null, 2));

    if (notification.type === 'payment' && notification.data.id) {
      const paymentId = notification.data.id;
      console.log(`Processing payment event for payment ID: ${paymentId}`);
      
      const paymentDetails = await payment.get({ id: paymentId });
      console.log('Fetched Payment Details:', JSON.stringify(paymentDetails, null, 2));

      if (paymentDetails.status === 'approved' && paymentDetails.external_reference) {
        const { external_reference } = paymentDetails;
        
        // The `external_reference` was set as `${user._id.toString()}__${credits}__${Date.now()}`
        const [userId, creditsStr] = external_reference.split('__');
        const creditsPurchased = parseFloat(creditsStr);
        
        if (!userId || isNaN(creditsPurchased)) {
          throw new Error(`Invalid external_reference format: ${external_reference}`);
        }
        
        const userObjectId = new ObjectId(userId);

        const { db } = await connectToDatabase();
        const updateResult = await db.collection<UserProfile>('userProfiles').updateOne(
          { _id: userObjectId },
          { $inc: { credits: creditsPurchased } }
        );

        if (updateResult.modifiedCount === 1) {
          console.log(`✅ Successfully added ${creditsPurchased} credits to user ${userId}.`);
        } else {
          // This could happen if the user was deleted between payment and webhook processing.
          console.error(`❌ Failed to update credits for user ${userId}. User not found or credits not updated.`);
        }
      } else {
        console.log(`Payment ${paymentId} is not approved or has no external_reference. Status: ${paymentDetails.status}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing Mercado Pago webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
