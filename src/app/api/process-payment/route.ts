// src/app/api/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("❌ CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
}

const client = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, issuer_id, payment_method_id, transaction_amount, installments, payer, external_reference } = body;
    
    if (!token || !payment_method_id || !transaction_amount || !payer?.email || !external_reference) {
      return NextResponse.json({ message: 'Faltan datos para procesar el pago.' }, { status: 400 });
    }

    const [userId] = external_reference.split('__');
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Referencia externa inválida.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection<UserProfile>('userProfiles').findOne({ _id: new ObjectId(userId) });
    if (!user) {
        return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    const paymentData: any = {
      transaction_amount: Number(transaction_amount),
      token: token,
      description: 'Recarga de Créditos Hey Manito!',
      installments: Number(installments),
      payment_method_id: payment_method_id,
      issuer_id: issuer_id,
      external_reference,
      payer: {
        email: payer.email,
        first_name: user.firstName, // Use saved user data for consistency
        last_name: user.lastName,
      },
    };
    
    // MercadoPago API requires identification for card payments.
    // This data is sent securely by the Card Payment Brick.
    if (payer.identification && payer.identification.type && payer.identification.number) {
        paymentData.payer.identification = {
            type: payer.identification.type,
            number: payer.identification.number
        };
    }

    console.log("🟡 Processing payment with data:", JSON.stringify(paymentData, null, 2));
    
    const paymentResult = await payment.create({ body: paymentData });
    
    console.log("✅ Payment processed successfully:", JSON.stringify(paymentResult, null, 2));

    // Handle the payment status. If approved, update user credits.
    if (paymentResult.status === 'approved') {
        const [ , creditsStr ] = external_reference.split('__');
        const creditsPurchased = parseFloat(creditsStr);

        await db.collection<UserProfile>('userProfiles').updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { credits: creditsPurchased } }
        );
        console.log(`✅ Successfully added ${creditsPurchased} credits to user ${userId}.`);
    }

    return NextResponse.json({ 
        status: paymentResult.status, 
        status_detail: paymentResult.status_detail,
        id: paymentResult.id 
    });

  } catch (error: any) {
    const errorMessage = error.cause?.message || error.message || 'Ocurrió un error inesperado al procesar el pago.';
    console.error('❌ --- PAYMENT PROCESSING ERROR ---');
    console.error('Error message:', errorMessage);
    console.error('Full Error:', error);
    
    return NextResponse.json(
      { message: `No se pudo procesar el pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
