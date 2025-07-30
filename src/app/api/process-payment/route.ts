// src/app/api/process-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

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
    const { token, issuer_id, payment_method_id, transaction_amount, installments, payer } = body;
    
    if (!token || !payment_method_id || !transaction_amount || !payer?.email) {
      return NextResponse.json({ message: 'Faltan datos para procesar el pago.' }, { status: 400 });
    }

    const paymentData: any = {
      transaction_amount: Number(transaction_amount),
      token: token,
      description: 'Recarga de Créditos Hey Manito!',
      installments: Number(installments),
      payment_method_id: payment_method_id,
      issuer_id: issuer_id,
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        last_name: payer.last_name,
      },
    };
    
    // Safely add identification if it exists
    if (payer.identification && payer.identification.type && payer.identification.number) {
        paymentData.payer.identification = {
            type: payer.identification.type,
            number: payer.identification.number
        };
    }

    console.log("🟡 Processing payment with data:", JSON.stringify(paymentData, null, 2));
    
    const paymentResult = await payment.create({ body: paymentData });
    
    console.log("✅ Payment processed successfully:", JSON.stringify(paymentResult, null, 2));

    return NextResponse.json({ 
        status: paymentResult.status, 
        status_detail: paymentResult.status_detail,
        id: paymentResult.id 
    });

  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Ocurrió un error inesperado al procesar el pago.';
    console.error('❌ --- PAYMENT PROCESSING ERROR ---');
    console.error('Error message:', errorMessage);
    console.error('Full Error:', error.response?.data || error);
    
    return NextResponse.json(
      { message: `No se pudo procesar el pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
