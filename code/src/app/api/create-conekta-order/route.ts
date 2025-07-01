
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import Conekta from 'conekta';
import { CREDIT_PACKAGES } from '@/config/appConfig';

export async function POST(request: NextRequest) {
  // Lee la clave desde las variables de entorno. Esta es la forma correcta y segura.
  const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;

  // Verifica si la clave está configurada en el servidor.
  if (!CONEKTA_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set in environment variables. Payment processing will fail.");
    return NextResponse.json({ error: 'La pasarela de pago no está configurada correctamente en el servidor. Falta la clave privada.' }, { status: 500 });
  }

  // Configura la instancia de Conekta para esta solicitud.
  Conekta.api_key = CONEKTA_PRIVATE_KEY;
  Conekta.locale = 'es';

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

    // Fija la expiración a 24 horas desde ahora (en formato de timestamp Unix).
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    const orderPayload = {
      currency: 'MXN',
      customer_info: {
        name: userName,
        email: userEmail,
        phone: '+525555555555' // Conekta requiere un número de teléfono, usamos un placeholder.
      },
      line_items: [{
        name: `${creditPackage.credits} Créditos para ${process.env.NEXT_PUBLIC_APP_NAME || 'Hey Manito!'}`,
        unit_price: creditPackage.price * 100, // El precio debe estar en centavos.
        quantity: 1
      }],
      metadata: {
        firebaseUid: firebaseUid,
        credits: String(creditPackage.credits), // Conekta prefiere strings en metadata.
      },
      charges: [{
        payment_method: {
            type: 'spei',
            expires_at: expiresAt
        }
      }]
    };

    const order = await Conekta.Order.create(orderPayload);
    const orderJSON = order.toObject();

    if (!orderJSON.charges?.data?.[0]?.payment_method?.clabe) {
        console.error('Error: SPEI CLABE not found in Conekta response.', orderJSON);
        throw new Error('No se pudo generar la información de pago SPEI.');
    }
    
    const speiInfo = {
        clabe: orderJSON.charges.data[0].payment_method.clabe,
        bank: orderJSON.charges.data[0].payment_method.bank,
        amount: orderJSON.amount / 100, // Convertir desde centavos.
        beneficiary: orderJSON.company?.name_es || 'Hey Manito!',
    };

    return NextResponse.json({ speiInfo });

  } catch (error: any) {
    console.error('Error al crear la orden de Conekta:', error);
    const errorMessage = error.details ? error.details.map((d: any) => d.message).join(', ') : error.message;
    return NextResponse.json({ error: errorMessage || 'No se pudo crear la orden de pago.' }, { status: 500 });
  }
}
