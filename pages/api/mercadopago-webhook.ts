// /pages/api/mercadopago-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, Transaction } from '@/types';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// This should be your PRODUCTION access token in a real environment
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

// It's critical to check for the access token at the module level.
if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set for the webhook.");
}

const client = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN! });
const payment = new Payment(client);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    console.log("API ROUTE: /api/mercadopago-webhook reached.");
    
    if (!MERCADOPAGO_ACCESS_TOKEN) {
        return res.status(503).json({ error: 'Webhook processor not configured.' });
    }

    const { type, data } = req.body;

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
                    return res.status(200).json({ received: true, message: 'External reference missing, cannot process.' });
                }

                const [firebaseUid, creditsStr] = external_reference.split('__');
                const creditsToAdd = parseInt(creditsStr, 10);

                if (!firebaseUid || isNaN(creditsToAdd) || creditsToAdd <= 0) {
                    console.error(`Invalid external_reference format for payment ${paymentId}: ${external_reference}`);
                    return res.status(200).json({ received: true, message: 'Invalid external reference, cannot process.' });
                }

                const { db } = await connectToDatabase();
                const userProfileCollection = db.collection<UserProfile>('userProfiles');
                const transactionsCollection = db.collection<Transaction>('transactions');
                const session = db.client.startSession();

                try {
                    await session.withTransaction(async () => {
                        const existingTransaction = await transactionsCollection.findOne({ orderId: String(paymentId) }, { session });
                        if (existingTransaction) {
                            console.log(`Transaction for payment ID ${paymentId} already processed. Acknowledging webhook.`);
                            return;
                        }

                        const userUpdateResult = await userProfileCollection.findOneAndUpdate(
                            { firebaseUid: firebaseUid },
                            { $inc: { credits: creditsToAdd } },
                            { returnDocument: 'after', session }
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

                            await transactionsCollection.insertOne(newTransaction as Transaction, { session });
                            console.log(`Transaction for payment ${paymentId} logged successfully.`);
                        } else {
                            throw new Error(`CRITICAL: User with firebaseUid ${firebaseUid} not found. Could not add credits or log transaction for payment ${paymentId}.`);
                        }
                    });
                } finally {
                    await session.endSession();
                }
            }
        } catch (error: any) {
            console.error(`Error processing payment ID ${paymentId}:`, error);
            return res.status(500).json({ error: 'An internal error occurred while processing payment.' });
        }
    }

    return res.status(200).json({ received: true });
}
