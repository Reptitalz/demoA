
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, Transaction } from '@/types';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-5778475401797182-071902-c7bf3fe911512a93a32422643348f123-2558541332';

const client = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN });
const payment = new Payment(client);

export async function POST(request: NextRequest) {
  console.log("API ROUTE: /api/mercadopago-webhook reached.");
  
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error("CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
    return NextResponse.json({ error: 'Webhook processor not configured.' }, { status: 500 });
  }

  const body = await request.json();
  const { type, data } = body;

  console.log('Webhook event received:', type);

  if (type === 'payment') {
    const paymentId = data.id;
    console.log('Processing payment event for ID:', paymentId);

    try {
      const confirmedPayment = await payment.get({ id: paymentId });
      console.log('Payment status:', confirmedPayment.status);

      if (confirmedPayment.status === 'approved') {
        const external_reference = confirmedPayment.external_reference;
        if (!external_reference) {
          console.error(`Webhook for payment ${paymentId} is missing external_reference.`);
          return NextResponse.json({ received: true, message: 'External reference missing, cannot process.' });
        }

        const [firebaseUid, creditsStr] = external_reference.split('__');
        const creditsToAdd = parseInt(creditsStr, 10);

        if (!firebaseUid || isNaN(creditsToAdd)) {
          console.error(`Invalid external_reference format for payment ${paymentId}: ${external_reference}`);
          return NextResponse.json({ received: true, message: 'Invalid external reference, cannot process.' });
        }

        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>('userProfiles');
        const transactionsCollection = db.collection<Transaction>('transactions');

        // Check if transaction has already been processed
        const existingTransaction = await transactionsCollection.findOne({ orderId: String(paymentId) });
        if (existingTransaction) {
            console.log(`Transaction for payment ID ${paymentId} already processed. Acknowledging webhook.`);
            return NextResponse.json({ received: true });
        }

        const userUpdateResult = await userProfileCollection.findOneAndUpdate(
          { firebaseUid: firebaseUid },
          { $inc: { credits: creditsToAdd } },
          { returnDocument: 'after' }
        );

        if (userUpdateResult) {
          console.log(`Successfully added ${creditsToAdd} credits to user ${firebaseUid}. New balance: ${userUpdateResult.credits}`);
          
          const newTransaction: Omit<Transaction, '_id'> = {
            userId: firebaseUid,
            orderId: String(paymentId),
            amount: confirmedPayment.transaction_amount || 0,
            currency: confirmedPayment.currency_id || 'MXN',
            creditsPurchased: creditsToAdd,
            paymentMethod: confirmedPayment.payment_type_id || 'unknown',
            status: confirmedPayment.status,
            createdAt: new Date(confirmedPayment.date_created || Date.now()),
            customerInfo: {
              name: `${confirmedPayment.payer?.first_name || ''} ${confirmedPayment.payer?.last_name || ''}`.trim(),
              email: confirmedPayment.payer?.email || 'not provided',
              phone: confirmedPayment.payer?.phone?.number || 'not provided',
            },
          };

          await transactionsCollection.insertOne(newTransaction as Transaction);
          console.log(`Transaction for payment ${paymentId} logged successfully.`);

        } else {
          console.error(`CRITICAL: User with firebaseUid ${firebaseUid} not found. Could not add credits or log transaction for payment ${paymentId}.`);
        }
      }
    } catch (error: any) {
      console.error(`Error processing payment ID ${paymentId}:`, error);
      return NextResponse.json({ error: 'An internal error occurred while processing payment.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
