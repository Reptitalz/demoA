// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Este endpoint es DEPRECADO y ahora actúa como un proxy seguro
 * al webhook externo que procesa los mensajes de los asistentes de IA.
 * La comunicación principal de chat entre usuarios se maneja vía WebSockets.
 * 
 * @webhook_url https://control.reptitalz.cloud/api/webhook/[chatPath]
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get all necessary data from the client's request
    const { assistantId, chatPath, message, destination } = await request.json();

    // 2. Validate that all required parameters are present
    if (!assistantId || !chatPath || !message || !destination) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos (assistantId, chatPath, message, destination).' }, { status: 400 });
    }
    
    // 3. Define el webhook externo del asistente de IA.
    const CHAT_WEBHOOK_URL = `https://control.reptitalz.cloud/api/webhook/${chatPath}`;

    // 4. Construct the precise payload the external server expects.
    // This payload does NOT have a nested "payload" object like in the user's curl example.
    // The structure is flat and contains the fields needed by the AI webhook.
    const payload = {
      assistantId,
      message,
      destination,
    };

    // Log the request for debugging purposes
    console.log(`Forwarding message to external webhook: ${CHAT_WEBHOOK_URL} with payload:`, JSON.stringify(payload, null, 2));

    // 5. Make the server-to-server request
    const webhookResponse = await axios.post(CHAT_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000 // 15-second timeout for the external service to respond
    });
    
    // 6. Check the response from the external webhook
    if (webhookResponse.status >= 300) {
        // If the external service returned an error, forward it to our client
        console.error(`External webhook at ${CHAT_WEBHOOK_URL} responded with error:`, webhookResponse.data);
        return NextResponse.json(
            { message: 'El agente externo respondió con un error.', details: webhookResponse.data },
            { status: webhookResponse.status }
        );
    }

    // 7. Confirm to the client that the message was successfully dispatched
    return NextResponse.json({ success: true, message: 'Mensaje enviado para procesamiento.', data: webhookResponse.data });

  } catch (error: any) {
    console.error('API Error (api/chat/send proxy):', error);

    // Provide detailed error feedback to the client
    if (axios.isAxiosError(error)) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            return NextResponse.json({ message: 'Error del servidor externo.', details: error.response.data }, { status: error.response.status });
        } else if (error.request) {
            // The request was made but no response was received
            return NextResponse.json({ message: 'No se recibió respuesta del servidor externo.' }, { status: 504 });
        }
    }
    // Something happened in setting up the request that triggered an Error
    return NextResponse.json({ message: 'Error interno del servidor al procesar el envío.', details: error.message }, { status: 500 });
  }
}
