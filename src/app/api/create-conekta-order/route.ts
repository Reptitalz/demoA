
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import axios from 'axios';
import { CREDIT_PACKAGES } from '@/config/appConfig';

const CONEKTA_API_URL = 'https://api.conekta.io';
const CONEKTA_API_VERSION = '2.0.0';

export async function POST(request: NextRequest) {
  const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;
  if (!CONEKTA_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set.");
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

    const { packageCredits } = await request.json();
    if (!packageCredits) {
      return NextResponse.json({ error: 'El paquete de créditos es requerido.' }, { status: 400 });
    }

    const creditPackage = CREDIT_PACKAGES.find(p => p.credits === packageCredits);
    if (!creditPackage) {
      return NextResponse.json({ error: 'Paquete de créditos inválido.' }, { status: 400 });
    }

    const IVA_RATE = 1.16;
    const priceWithIvaCents = Math.round(creditPackage.price * IVA_RATE * 100);
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

    const orderPayload = {
      currency: 'MXN',
      customer_info: {
        name: userName,
        email: userEmail,
        phone: '+525555555555' // Placeholder required by Conekta
      },
      line_items: [{
        name: `${creditPackage.credits} Créditos para ${process.env.NEXT_PUBLIC_APP_NAME || 'Hey Manito!'} (+IVA)`,
        unit_price: priceWithIvaCents,
        quantity: 1
      }],
      metadata: {
        firebaseUid: firebaseUid,
        credits: String(creditPackage.credits),
      },
      charges: [{
        payment_method: {
          type: 'spei',
          expires_at: expiresAt
        }
      }]
    };
    
    console.log("Creating Conekta order via Axios with payload:", JSON.stringify(orderPayload, null, 2));

    const response = await axios.post(
        `${CONEKTA_API_URL}/orders`, 
        orderPayload, 
        {
          headers: {
            'Accept': `application/vnd.conekta-v${CONEKTA_API_VERSION}+json`,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONEKTA_PRIVATE_KEY}`
          }
        }
    );
    
    const order = response.data;
    const charge = order.charges?.data?.[0];

    if (!charge?.payment_method?.clabe) {
      console.error('Error: SPEI CLABE not found in Conekta response.', JSON.stringify(order, null, 2));
      throw new Error('No se pudo generar la información de pago SPEI desde Conekta.');
    }

    const speiInfo = {
      clabe: charge.payment_method.clabe,
      bank: charge.payment_method.bank,
      amount: order.amount / 100,
      beneficiary: process.env.NEXT_PUBLIC_APP_NAME || 'Hey Manito!',
    };

    console.log("Successfully created SPEI order. Returning clabe to client.");
    return NextResponse.json({ speiInfo });

  } catch (error: any) {
    console.error('--- CONEKTA API AXIOS ERROR ---');
    const errorMessage = error.response?.data?.details?.[0]?.message || error.message || 'Ocurrió un error inesperado.';
    console.error('Full Error Object:', JSON.stringify(error.response?.data || error, null, 2));
    return NextResponse.json({ error: `No se pudo crear la orden de pago: ${errorMessage}` }, { status: 500 });
  }
}
