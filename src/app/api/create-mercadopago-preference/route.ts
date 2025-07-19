
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PRICE_PER_CREDIT } from '@/config/appConfig';
import { APP_NAME } from '@/config/appConfig';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-5778475401797182-071902-c7bf3fe911512a93a32422643348f123-2558541332';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

const client = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN });
const preference = new Preference(client);

export async function POST(request: NextRequest) {
  if (!MERCADOPAGO_ACCESS_TOKEN) {
    console.error("CRITICAL ERROR: MERCADOPAGO_ACCESS_TOKEN is not set.");
    return NextResponse.json({ error: 'La pasarela de pago no está configurada.' }, { status: 500 });
  }

  try {
    const decodedToken = await verifyFirebaseToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
    const firebaseUid = decodedToken.uid;
    const userEmail = decodedToken.email;
    const userName = decodedToken.name || userEmail || 'Usuario';

    const { credits } = await request.json();
    if (!credits || typeof credits !== 'number' || credits <= 0 || !Number.isInteger(credits)) {
      return NextResponse.json({ error: 'La cantidad de créditos debe ser un número entero positivo.' }, { status: 400 });
    }

    const price = credits * PRICE_PER_CREDIT;
    const IVA_RATE = 1.16;
    const unitPriceWithIva = parseFloat((price * IVA_RATE).toFixed(2));

    // Create a unique reference for this transaction
    const external_reference = `${firebaseUid}__${credits}__${Date.now()}`;

    const preferencePayload = {
      body: {
        items: [
          {
            id: `credits-${credits}`,
            title: `${credits} Crédito(s) para ${APP_NAME}`,
            quantity: 1,
            unit_price: unitPriceWithIva,
            currency_id: 'MXN',
            description: `Paquete de ${credits} créditos para usar en la plataforma ${APP_NAME}.`,
          },
        ],
        payer: {
            name: userName.split(' ')[0],
            surname: userName.split(' ').slice(1).join(' ') || 'N/A',
            email: userEmail,
        },
        back_urls: {
          success: `${BASE_URL}/dashboard?status=success`,
          failure: `${BASE_URL}/dashboard?status=failure`,
          pending: `${BASE_URL}/dashboard?status=pending`,
        },
        auto_return: 'approved' as const,
        notification_url: `${BASE_URL}/api/mercadopago-webhook`,
        external_reference: external_reference,
        statement_descriptor: APP_NAME.substring(0, 10),
      },
    };
    
    console.log("Creating Mercado Pago preference with payload:", JSON.stringify(preferencePayload, null, 2));

    const result = await preference.create(preferencePayload);
    
    console.log("Successfully created Mercado Pago preference:", result.id);
    return NextResponse.json({ preferenceId: result.id });

  } catch (error: any) {
    console.error('--- MERCADO PAGO API ERROR ---');
    const errorMessage = error.cause?.message || error.message || 'Ocurrió un error inesperado.';
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: `No se pudo crear la preferencia de pago: ${errorMessage}` }, { status: 500 });
  }
}
