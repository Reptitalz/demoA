
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PRICE_PER_CREDIT, APP_NAME } from '@/config/appConfig';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("❌ CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
}

const client = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'La pasarela de pago no está configurada correctamente.' },
      { status: 503 }
    );
  }

  try {
    const decodedToken = await verifyFirebaseToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const firebaseUid = decodedToken.uid;
    const userEmail = decodedToken.email;

    const { credits } = await request.json();

    if (
      !credits ||
      typeof credits !== 'number' ||
      credits <= 0 ||
      !Number.isInteger(credits)
    ) {
      return NextResponse.json(
        { error: 'La cantidad de créditos debe ser un número entero positivo.' },
        { status: 400 }
      );
    }

    const price = credits * PRICE_PER_CREDIT;
    const IVA_RATE = 1.16;
    const totalAmount = parseFloat((price * IVA_RATE).toFixed(2));
    const external_reference = `${firebaseUid}__${credits}__${Date.now()}`;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1);

    const paymentPayload = {
      transaction_amount: totalAmount,
      description: `${credits} Crédito(s) para ${APP_NAME}`,
      payment_method_id: 'spei',
      payer: {
        email: userEmail,
      },
      external_reference,
      notification_url: `${BASE_URL}/api/mercadopago-webhook`,
      date_of_expiration: expirationDate.toISOString(),
    };

    console.log(
      '🟡 Creating Mercado Pago SPEI payment with payload:',
      JSON.stringify({ body: paymentPayload }, null, 2)
    );

    const result = await payment.create({ body: paymentPayload });

    console.log('✅ SPEI Payment created successfully:', result.id);

    const speiDetails = result.point_of_interaction?.transaction_data;

    if (!speiDetails || !speiDetails.bank_transfer?.clabe) {
      console.error(
        '❌ SPEI details (CLABE) not found in Mercado Pago response:',
        result.id
      );
      return NextResponse.json(
        { error: 'No se pudieron obtener los detalles para la transferencia SPEI.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentId: result.id,
      clabe: speiDetails.bank_transfer.clabe,
      bankName: speiDetails.bank_info?.payer?.[0]?.account_name || 'STP',
      amount: result.transaction_amount,
      concept: external_reference.substring(0, 10),
    });

  } catch (error: any) {
    const errorMessage =
      error.cause?.message || error.message || 'Ocurrió un error inesperado.';
    console.error('❌ --- MERCADO PAGO API ERROR ---');
    console.error('Error message:', errorMessage);
    console.error('Full Error:', error);

    return NextResponse.json(
      { error: `No se pudo crear la orden de pago: ${errorMessage}` },
      { status: 500 }
    );
  }
}
