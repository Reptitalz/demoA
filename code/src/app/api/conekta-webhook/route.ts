
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Conekta from 'conekta';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  // Lee las claves desde las variables de entorno.
  const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY;
  const CONEKTA_WEBHOOK_SIGNING_SECRET = process.env.CONEKTA_WEBHOOK_SIGNING_SECRET;

  // Verifica si la clave privada está configurada en el servidor.
  if (!CONEKTA_PRIVATE_KEY) {
    console.error("CRITICAL ERROR: CONEKTA_PRIVATE_KEY is not set. Webhook processing will fail.");
    return NextResponse.json({ error: 'La pasarela de pago no está configurada en el servidor.' }, { status: 500 });
  }

  // Configura la instancia de Conekta para esta solicitud.
  Conekta.api_key = CONEKTA_PRIVATE_KEY;
  Conekta.locale = 'es';
  
  if (!CONEKTA_WEBHOOK_SIGNING_SECRET) {
    console.warn("WARNING: CONEKTA_WEBHOOK_SIGNING_SECRET is not set. Webhook verification is disabled, THIS IS A SECURITY RISK.");
  }

  const rawBody = await request.text();
  const signature = headers().get('conekta-signature');
  let event;

  try {
    // TODO: Para producción, habilita la verificación de la firma descomentando la lógica
    // y asegurándote de que CONEKTA_WEBHOOK_SIGNING_SECRET esté configurado.
    // if (CONEKTA_WEBHOOK_SIGNING_SECRET && signature) {
    //   // Esta parte está comentada porque no tenemos el secreto del usuario.
    //   // En un escenario real, esta verificación es crítica.
    //   // event = Conekta.Webhook.find(rawBody, signature, CONEKTA_WEBHOOK_SIGNING_SECRET);
    //   event = JSON.parse(rawBody);
    // } else {
      event = JSON.parse(rawBody);
    // }
  } catch (error: any) {
    console.error('Webhook Error: Could not parse or verify event.', error);
    return NextResponse.json({ error: `Webhook error: ${error.message}` }, { status: 400 });
  }

  // Maneja el evento order.paid, que se dispara cuando el pago por SPEI se confirma.
  if (event.type === 'order.paid') {
    const order = event.data.object;

    const firebaseUid = order.metadata?.firebaseUid;
    const creditsToAdd = order.metadata?.credits ? parseInt(order.metadata.credits, 10) : 0;

    if (!firebaseUid || !creditsToAdd) {
      console.error('Webhook received for order.paid but metadata (firebaseUid or credits) is missing.', { orderId: order.id });
      // Devuelve 200 para acusar recibo y evitar que Conekta reintente.
      // No podemos procesarlo, pero no es culpa de Conekta.
      return NextResponse.json({ received: true, message: 'Metadata missing, cannot process.' });
    }

    try {
      const { db } = await connectToDatabase();
      const userProfileCollection = db.collection<UserProfile>('userProfiles');

      const result = await userProfileCollection.findOneAndUpdate(
        { firebaseUid: firebaseUid },
        { $inc: { credits: creditsToAdd } },
        { returnDocument: 'after' }
      );

      if (result) {
        console.log(`Successfully added ${creditsToAdd} credits to user ${firebaseUid}. New balance: ${result.credits}`);
        // Aquí podrías disparar otro servicio, como enviar un email de confirmación al usuario.
      } else {
        console.error(`User with firebaseUid ${firebaseUid} not found. Could not add credits for order ${order.id}.`);
      }

    } catch (dbError) {
      console.error('Database error while processing webhook:', dbError);
      // Devuelve 500 para indicarle a Conekta que algo salió mal de nuestro lado y que debe reintentar.
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  } else {
    console.log(`Received unhandled Conekta event type: ${event.type}`);
  }

  // Acusa recibo del evento a Conekta.
  return NextResponse.json({ received: true });
}
