// src/app/api/mercadopago-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { UserProfile } from '@/types';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN!,
});
const payment = new Payment(client);

// Función para verificar la firma del webhook
function verifyWebhookSignature(request: NextRequest, rawBody: string, secret: string): boolean {
  const signatureHeader = request.headers.get('x-signature');
  if (!signatureHeader) {
    console.error('Missing x-signature header');
    return false;
  }

  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);

  const ts = parts['ts'];
  const hash = parts['v1'];
  
  if (!ts || !hash) {
    console.error('Invalid signature header format');
    return false;
  }

  // data.id se obtiene del cuerpo (body), no de los parámetros de búsqueda.
  const notification = JSON.parse(rawBody);
  const dataId = notification.data?.id;

  if (!dataId) {
      console.error('data.id not found in webhook body');
      return false;
  }
  
  const manifest = `id:${dataId};request-id:${request.headers.get('x-request-id')};ts:${ts};`;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const generatedHash = hmac.digest('hex');

  return generatedHash === hash;
}

export async function POST(request: NextRequest) {
  console.log('--- Mercado Pago Webhook Received ---');
  
  const rawBody = await request.text();
  
  // Es crucial verificar la firma ANTES de procesar cualquier cosa.
  if (MERCADOPAGO_WEBHOOK_SECRET) {
      if (!verifyWebhookSignature(request, rawBody, MERCADOPAGO_WEBHOOK_SECRET)) {
          console.error('Webhook signature verification failed.');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified successfully.');
  } else {
      console.warn('MERCADOPAGO_WEBHOOK_SECRET is not configured. Skipping signature verification. This is NOT recommended for production.');
  }

  try {
    const notification = JSON.parse(rawBody);
    console.log('Notification body:', JSON.stringify(notification, null, 2));

    if (notification.type === 'payment' && notification.data.id) {
      const paymentId = notification.data.id;
      console.log(`Processing payment event for payment ID: ${paymentId}`);
      
      const paymentDetails = await payment.get({ id: paymentId });
      console.log('Fetched Payment Details:', JSON.stringify(paymentDetails, null, 2));

      if (paymentDetails.status === 'approved' && paymentDetails.external_reference) {
        const { external_reference } = paymentDetails;
        
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