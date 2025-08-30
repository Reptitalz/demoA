// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// This endpoint is no longer used for sending messages directly from the client chat page.
// The client now posts directly to the external webhook.
// This file is kept in case it's used by other parts of the system or for future use.
// It currently forwards a request but won't be hit by the main chat UI.

export async function POST(request: NextRequest) {
  try {
    const { assistantId, chatPath, message, executionId, destination } = await request.json();

    if (!chatPath || !message || !assistantId || !executionId || !destination) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos (assistantId, chatPath, message, executionId, destination).' }, { status: 400 });
    }
    
    // The webhook URL for sending the user's message.
    const CHAT_WEBHOOK_URL = `https://control.reptitalz.cloud/api/webhook/${chatPath}`;

    // Construct the payload according to the required format
    const payload = {
      message,
      destination,
    };

    // Asynchronously forward the request to the external webhook
    axios.post(CHAT_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000 // 5-second timeout
    }).catch(error => {
        // We log the error but don't want to block the client response
        console.error(`Error forwarding chat message to ${CHAT_WEBHOOK_URL}:`, error.message);
    });

    // Immediately confirm to the client that the message has been dispatched for processing
    return NextResponse.json({ success: true, message: 'Mensaje enviado para procesamiento.' });

  } catch (error: any) {
    console.error('API Error (api/chat/send):', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
