
// src/app/api/mercadopago-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { UserProfile } from '@/types';

// This is a simplified webhook handler. In production, you should
// verify the webhook signature from Mercado Pago for security.

export async function POST(request: NextRequest) {
  console.log('--- Mercado Pago Webhook Received ---');
  try {
    const notification = await request.json();
    console.log('Notification body:', JSON.stringify(notification, null, 2));

    if (notification.type === 'payment' && notification.action === 'payment.created') {
      const paymentId = notification.data.id;
      console.log(`Processing payment created event for payment ID: ${paymentId}`);
      
      // In a real app, you would fetch the payment details from Mercado Pago API
      // using the paymentId to get the external_reference and payment status.
      // For this simulation based on the provided preference structure, we'll
      // assume the webhook for an approved payment comes with enough info or
      // that fetching the payment is the next step.
      
      // Let's assume we fetch the payment and get the external_reference
      // The `external_reference` was set as `${user._id.toString()}__${credits}__${Date.now()}`
      
      // Since we don't have the payment details in this simplified webhook payload,
      // we can't process it directly. A real implementation MUST fetch the payment:
      // const paymentResponse = await mercadopago.payment.findById(paymentId);
      // const { external_reference, status } = paymentResponse.body;
      
      // For now, we will log that we received it.
      // A full implementation requires fetching payment details from MercadoPago API.
      console.log("Webhook received. A full implementation would now fetch payment details from MercadoPago to get external_reference and status.");

      // Example of how to process after fetching payment details:
      /*
      if (status === 'approved') {
        const [userId, creditsStr] = external_reference.split('__');
        const creditsPurchased = parseFloat(creditsStr);
        const userObjectId = new ObjectId(userId);

        if (!userObjectId || isNaN(creditsPurchased)) {
          throw new Error(`Invalid external_reference format: ${external_reference}`);
        }

        const { db } = await connectToDatabase();
        const updateResult = await db.collection<UserProfile>('userProfiles').updateOne(
          { _id: userObjectId },
          { $inc: { credits: creditsPurchased } }
        );

        if (updateResult.modifiedCount === 1) {
          console.log(`Successfully added ${creditsPurchased} credits to user ${userId}.`);
        } else {
          console.error(`Failed to update credits for user ${userId}. User not found or credits not updated.`);
        }
      }
      */
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
