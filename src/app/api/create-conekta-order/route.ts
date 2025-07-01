
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import Conekta from 'conekta';
import { CREDIT_PACKAGES } from '@/config/appConfig';

export async function POST(request: NextRequest) {
  // START OF ROUTE LOG
  console.log("API ROUTE: /api/create-conekta-order reached.");

  const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;

  if (!CONEKTA_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set in environment variables. Payment processing will fail.");
    return NextResponse.json({ error: 'La pasarela de pago no está configurada correctamente. Contacta al administrador.' }, { status: 500 });
  } else {
    // Log a masked version for verification without leaking the key
    console.log("CONEKTA_PRIVATE_KEY found. Key starts with: " + CONEKTA_PRIVATE_KEY.substring(0, 8));
  }
  
  // Configure Conekta instance for THIS request
  Conekta.api_key = CONEKTA_PRIVATE_KEY;
  Conekta.locale = 'es';

  try {
    const decodedToken = await verifyFirebaseToken(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'No autorizado. Token inválido o ausente.' }, { status: 401 });
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

    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

    const orderPayload = {
      currency: 'MXN',
      customer_info: {
        name: userName,
        email: userEmail,
        phone: '+525555555555' // Conekta requires a phone number, using a placeholder.
      },
      line_items: [{
        name: `${creditPackage.credits} Créditos para ${process.env.NEXT_PUBLIC_APP_NAME || 'Hey Manito!'}`,
        unit_price: creditPackage.price * 100, // Price in cents.
        quantity: 1
      }],
      metadata: {
        firebaseUid: firebaseUid,
        credits: String(creditPackage.credits), // Conekta prefers strings in metadata.
      },
      charges: [{
        payment_method: {
            type: 'spei',
            expires_at: expiresAt
        }
      }]
    };

    console.log("Creating Conekta order with payload:", JSON.stringify(orderPayload, null, 2));
    
    const order = await Conekta.Order.create(orderPayload);
    const orderJSON = order.toObject();

    // Aggressive check for the clabe
    if (!orderJSON?.charges?.data?.[0]?.payment_method?.clabe) {
        console.error('Error: SPEI CLABE not found in Conekta response. Full response:', JSON.stringify(orderJSON, null, 2));
        throw new Error('No se pudo generar la información de pago SPEI desde Conekta.');
    }
    
    const speiInfo = {
        clabe: orderJSON.charges.data[0].payment_method.clabe,
        bank: orderJSON.charges.data[0].payment_method.bank,
        amount: orderJSON.amount / 100,
        beneficiary: orderJSON.company?.name_es || 'Hey Manito!',
    };

    console.log("Successfully created SPEI order. Returning clabe to client.");
    return NextResponse.json({ speiInfo });

  } catch (error: any) {
    console.error('--- CONEKTA API ERROR ---');
    console.error('Error Type:', error.type); // Conekta-specific
    console.error('Error Message:', error.message);
    // SAFELY log the error object without stringifying it, to avoid circular reference crashes.
    console.error('Full Error Object:', error);
    
    // Create a user-friendly message
    const errorMessage = error.details && Array.isArray(error.details)
      ? error.details.map((d: any) => d.message || String(d)).join(', ') 
      : (error.message || 'Ocurrió un error inesperado al procesar el pago.');
      
    return NextResponse.json({ 
      error: `No se pudo crear la orden de pago: ${errorMessage}`,
      details: error.details || null
    }, { status: 500 });
  }
}
