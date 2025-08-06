// src/app/api/mercadopago-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, MerchantOrder } from 'mercadopago';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';
import { AppNotification } from '@/types';
import { sendPushNotification } from '@/services/pushService';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("❌ CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
}

const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN!,
});

const merchantOrder = new MerchantOrder(client);

export async function POST(request: NextRequest) {
    console.log("--- Mercado Pago Webhook received ---");
    const body = await request.json();
    const { searchParams } = new URL(request.url);

    const topic = body.topic || body.type;
    const notificationId = body.id || body.data?.id;
    
    // A newer type of webhook validation uses URL params instead of body
    const idFromParams = searchParams.get("data.id");
    const typeFromParams = searchParams.get("type");

    console.log("Webhook body:", JSON.stringify(body, null, 2));

    if ((!topic && !typeFromParams) || (!notificationId && !idFromParams)) {
        console.log("Webhook is missing topic/type or id. Ignoring.");
        return NextResponse.json({ status: 'ignored', reason: 'missing data' }, { status: 200 });
    }

    try {
        if (topic === 'merchant_order' || typeFromParams === 'merchant_order') {
            const orderId = notificationId || idFromParams;
            console.log(`Processing merchant_order: ${orderId}`);

            const order = await merchantOrder.get({ merchantOrderId: orderId });
            
            if (order && order.status === 'closed' && order.order_status === 'paid') {
                const lastPayment = order.payments?.[order.payments.length - 1];

                if (!lastPayment || lastPayment.status !== 'approved') {
                    console.log(`Order ${orderId} is closed but payment is not approved. Ignoring.`);
                    return NextResponse.json({ status: 'payment_not_approved' }, { status: 200 });
                }

                const externalReference = order.external_reference;
                if (!externalReference) {
                    console.error(`Error: Order ${orderId} is missing external_reference.`);
                    return NextResponse.json({ status: 'error', message: 'Missing external reference' }, { status: 400 });
                }
                
                const [userId, creditsStr] = externalReference.split('__');

                if (!userId || !ObjectId.isValid(userId) || !creditsStr) {
                    console.error(`Error: Invalid external_reference format for order ${orderId}: ${externalReference}`);
                    return NextResponse.json({ status: 'error', message: 'Invalid external reference format' }, { status: 400 });
                }

                const creditsPurchased = parseFloat(creditsStr);
                
                const { db } = await connectToDatabase();
                const userProfileCollection = db.collection<UserProfile>('userProfiles');
                
                // Idempotency check: see if this transaction has already been processed
                const existingTransaction = await db.collection('transactions').findOne({ orderId: order.id?.toString() });
                if (existingTransaction) {
                    console.log(`Order ${order.id} has already been processed. Skipping.`);
                    return NextResponse.json({ status: 'already_processed' }, { status: 200 });
                }

                // Update user credits
                await userProfileCollection.updateOne(
                    { _id: new ObjectId(userId) },
                    { $inc: { credits: creditsPurchased } }
                );
                
                // Create a transaction record to prevent reprocessing
                await db.collection('transactions').insertOne({
                    userId: new ObjectId(userId),
                    orderId: order.id?.toString(),
                    creditsPurchased,
                    amount: lastPayment.transaction_amount,
                    status: 'completed',
                    processedAt: new Date(),
                    webhookPayload: body, // Store the original payload for auditing
                });
                
                // Create a notification for the user
                 const notification: Omit<AppNotification, '_id'> = {
                    userId: userId,
                    message: `¡Recarga exitosa! Se han añadido ${creditsPurchased} créditos a tu cuenta.`,
                    type: 'success',
                    read: false,
                    createdAt: new Date().toISOString(),
                    link: '/dashboard'
                };
                await db.collection<AppNotification>('notifications').insertOne(notification as AppNotification);

                // Send a push notification
                await sendPushNotification(userId, {
                    title: '¡Recarga Exitosa!',
                    body: `Se añadieron ${creditsPurchased} créditos a tu cuenta.`,
                    url: '/dashboard', // URL to open on click
                    tag: 'credits-recharge' // To stack notifications
                });
                

                console.log(`✅ Successfully added ${creditsPurchased} credits to user ${userId} for order ${order.id}.`);
            }
        }
        
        return NextResponse.json({ status: 'received' }, { status: 200 });

    } catch (error) {
        console.error('❌ --- Webhook Processing Error ---');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error message:', errorMessage);
        console.error('Full Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed', details: errorMessage }, { status: 500 });
    }
}
