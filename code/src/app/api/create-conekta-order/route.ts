
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import Conekta from 'conekta';
import { CREDIT_PACKAGES } from '@/config/appConfig';

const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;

if (!CONEKTA_PRIVATE_KEY) {
  console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set. Payment processing will fail.");
} else {
  Conekta.api_key = CONEKTA_PRIVATE_KEY;
  Conekta.locale = 'es';
}

export async function POST(request: NextRequest) {
  if (!CONEKTA_PRIVATE_KEY) {
    return NextResponse.json({ error: 'La pasarela de pago no está configurada en el servidor.' }, { status: 500 });
  }

  try {
    const decodedToken = await verifyFirebaseToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const firebaseUid = decodedToken.uid;
    const userEmail = decodedToken.email;
    const userName = decodedToken.name || userEmail || 'Usuario';

    const { packageCredits } = await request.json();
    if (!packageCredits) {
      return NextResponse.json({ error: 'El paquete de créditos es requerido' }, { status: 400 });
    }

    const creditPackage = CREDIT_PACKAGES.find(p => p.credits === packageCredits);
    if (!creditPackage) {
      return NextResponse.json({ error: 'Paquete de créditos inválido' }, { status: 400 });
    }

    const orderPayload = {
      currency: 'MXN',
      customer_info: {
        name: userName,
        email: userEmail,
        phone: '+525555555555' // Conekta requiere un número de teléfono, se usa un marcador de posición.
      },
      line_items: [{
        name: `${creditPackage.credits} Créditos para ${process.env.NEXT_PUBLIC_APP_NAME || 'Hey Manito!'}`,
        unit_price: creditPackage.price * 100, // El precio debe estar en centavos.
        quantity: 1
      }],
      metadata: {
        firebaseUid: firebaseUid,
        credits: String(creditPackage.credits), // Los metadatos de Conekta prefieren strings.
      },
      checkout: {
        allowed_payment_methods: ['card', 'oxxo_cash']
      }
    };

    const order = await Conekta.Order.create(orderPayload);
    
    // El objeto de orden de conekta-node no es directamente serializable debido a las funciones.
    // Se extraen las partes necesarias, específicamente el objeto checkout.
    const orderJSON = order.toObject();

    return NextResponse.json({ checkout: orderJSON.checkout });

  } catch (error: any) {
    console.error('Error al crear la orden de Conekta:', error);
    // Los errores de Conekta a menudo vienen en un array de 'details'.
    const errorMessage = error.details ? error.details.map((d: any) => d.message).join(', ') : error.message;
    return NextResponse.json({ error: errorMessage || 'No se pudo crear la orden de pago.' }, { status: 500 });
  }
}
