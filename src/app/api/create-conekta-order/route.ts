
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import conekta from 'conekta';
import { CREDIT_PACKAGES } from '@/config/appConfig';

// Promisify the Conekta v4 callback-style functions
const createOrder = (payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        conekta.Order.create(payload, (err: any, res: any) => {
            if (err) {
                return reject(err);
            }
            // Resolve with the raw Conekta object, not the plain JS object,
            // to align with the provided working code snippet.
            resolve(res);
        });
    });
};

export async function POST(request: NextRequest) {
  console.log("API ROUTE: /api/create-conekta-order reached.");

  const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;

  if (!CONEKTA_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set in environment variables. Payment processing will fail.");
    return NextResponse.json({ error: 'La pasarela de pago no está configurada correctamente. Contacta al administrador.' }, { status: 500 });
  } else {
    console.log("CONEKTA_PRIVATE_KEY found. Key starts with: " + CONEKTA_PRIVATE_KEY.substring(0, 8));
  }
  
  // Configure Conekta instance for THIS request using v4 SDK syntax
  conekta.api_key = CONEKTA_PRIVATE_KEY;
  conekta.locale = 'es';

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

    // Add IVA (16%) to the price
    const IVA_RATE = 1.16;
    const priceWithIva = creditPackage.price * IVA_RATE;

    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

    const orderPayload = {
      currency: 'MXN',
      customer_info: {
        name: userName,
        email: userEmail,
        phone: '+525555555555' // Conekta requires a phone number, using a placeholder.
      },
      line_items: [{
        name: `${creditPackage.credits} Créditos para ${process.env.NEXT_PUBLIC_APP_NAME || 'Hey Manito!'} (+IVA)`,
        unit_price: Math.round(priceWithIva * 100), // Price in cents, rounded to avoid decimals.
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

    console.log("Creating Conekta order with v4 payload:", JSON.stringify(orderPayload, null, 2));
    
    // Use the promisified Conekta v4 function
    const order = await createOrder(orderPayload);
    
    // Check for the clabe in the v4 response structure, which is on the raw Conekta object.
    if (!order?.charges?._json?.data?.[0]?.payment_method?.clabe) {
        // Use .toObject() for safe logging to avoid circular reference errors.
        const orderForLogging = typeof order?.toObject === 'function' ? order.toObject() : order;
        console.error('Error: SPEI CLABE not found in Conekta v4 response. Full response:', JSON.stringify(orderForLogging, null, 2));
        throw new Error('No se pudo generar la información de pago SPEI desde Conekta.');
    }
    
    const speiInfo = {
        clabe: order.charges._json.data[0].payment_method.clabe,
        bank: order.charges._json.data[0].payment_method.bank,
        amount: order.amount / 100, // `amount` is a top-level property on the raw Conekta object
        beneficiary: process.env.NEXT_PUBLIC_APP_NAME || 'Hey Manito!', // Use a reliable name
    };

    console.log("Successfully created SPEI order with v4. Returning clabe to client.");
    return NextResponse.json({ speiInfo });

  } catch (error: any) {
    console.error('--- CONEKTA API V4 ERROR ---');
    console.error('Error Type:', error.type); // Conekta-specific error type
    console.error('Error Message:', error.message || error.message_to_purchaser);
    
    // Use .toObject() for safe logging of the error object
    const errorForLogging = typeof error?.toObject === 'function' ? error.toObject() : error;
    console.error('Full Error Object:', JSON.stringify(errorForLogging, null, 2));
    
    const errorMessage = error.details && Array.isArray(error.details)
      ? error.details.map((d: any) => d.message || String(d)).join(', ') 
      : (error.message_to_purchaser || error.message || 'Ocurrió un error inesperado al procesar el pago.');
      
    return NextResponse.json({ 
      error: `No se pudo crear la orden de pago: ${errorMessage}`,
      details: error.details || null
    }, { status: 500 });
  }
}
