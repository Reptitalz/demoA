
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PRICE_PER_CREDIT, APP_NAME } from '@/config/appConfig';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

// It's critical to check for the access token at the module level.
if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error("CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
}

const client = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN, options: { timeout: 5000 } });
const payment = new Payment(client);

export async function POST(request: NextRequest) {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    // This check is redundant if the server stops on missing token, but it's good practice.
    return NextResponse.json({ error: 'La pasarela de pago no está configurada correctamente.' }, { status: 503 });
  }

  try {
    const decodedToken = await verifyFirebaseToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
    const firebaseUid = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!userEmail) {
        return NextResponse.json({ error: 'El perfil de usuario no tiene un email asociado, lo cual es requerido para el pago.' }, { status: 400 });
    }

    const { credits } = await request.json();
    if (!credits || typeof credits !== 'number' || !Number.isInteger(credits) || credits <= 0) {
      return NextResponse.json({ error: 'La cantidad de créditos debe ser un número entero positivo.' }, { status: 400 });
    }

    const price = credits * PRICE_PER_CREDIT;
    const IVA_RATE = 1.16; // 16% IVA
    const totalAmount = parseFloat((price * IVA_RATE).toFixed(2));

    // Unique reference for this specific transaction
    const external_reference = `${firebaseUid}__${credits}__${Date.now()}`;

    // Set expiration for the payment (e.g., 1 day from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1);

    const paymentPayload = {
      transaction_amount: totalAmount,
      description: `${credits} Crédito(s) para ${APP_NAME}`,
      payment_method_id: 'spei',
      payer: {
        email: userEmail,
      },
      external_reference: external_reference,
      notification_url: `${BASE_URL}/api/mercadopago-webhook`,
      date_of_expiration: expirationDate.toISOString(),
    };
    
    console.log("Creating Mercado Pago SPEI payment with payload:", JSON.stringify({ body: paymentPayload }, null, 2));

    const result = await payment.create({ body: paymentPayload });
    
    console.log("Successfully created Mercado Pago SPEI payment:", result.id);
    
    const speiDetails = result.point_of_interaction?.transaction_data;

    if (!speiDetails || !speiDetails.bank_transfer?.clabe) {
        console.error("SPEI details (CLABE) not found in Mercado Pago response for payment:", result.id, JSON.stringify(result, null, 2));
        return NextResponse.json({ error: 'No se pudieron obtener los detalles para la transferencia SPEI.' }, { status: 500 });
    }

    // Return the necessary details for the user to make the transfer
    return NextResponse.json({
        paymentId: result.id,
        clabe: speiDetails.bank_transfer.clabe,
        bankName: speiDetails.bank_info?.payer?.[0]?.account_name || 'STP', // Default to STP as it's common
        amount: result.transaction_amount,
        concept: external_reference.substring(0, 10), // A short reference for the concept
    });

  } catch (error: any) {
    console.error('--- MERCADO PAGO API ERROR ---');
    // MercadoPago SDK v2 nests the actual error message in `cause`
    const errorMessage = error.cause?.message || error.message || 'Ocurrió un error inesperado.';
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: `No se pudo crear la orden de pago: ${errorMessage}` }, { status: 500 });
  }
}
