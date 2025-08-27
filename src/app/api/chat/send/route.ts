// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// The base domain for the webhook
const WEBHOOK_DOMAIN = 'https://control.reptitalz.cloud/api/webhook';

export async function POST(request: NextRequest) {
  try {
    // We still receive the full context from the client
    const { chatPath, message, executionId, destination } = await request.json();

    if (!chatPath || !message || !executionId || !destination) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos.' }, { status: 400 });
    }
    
    // Construct the dynamic webhook URL by removing the leading slash from chatPath
    const dynamicPath = chatPath.startsWith('/') ? chatPath.substring(1) : chatPath;
    const webhookUrl = `${WEBHOOK_DOMAIN}/${dynamicPath}`;

    // The new, simplified payload as requested
    const payload = {
      message,
      destination,
      executionId,
    };

    // Forward the request to the new dynamic webhook endpoint
    axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000 // 5-second timeout to avoid hanging
    }).catch(error => {
        // We log the error but don't want to block the client response
        console.error(`Error forwarding chat message to ${webhookUrl}:`, error.message);
    });

    // Immediately confirm to the client that the message has been dispatched
    return NextResponse.json({ success: true, message: 'Mensaje enviado para procesamiento.' });

  } catch (error: any) {
    console.error('API Error (api/chat/send):', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
