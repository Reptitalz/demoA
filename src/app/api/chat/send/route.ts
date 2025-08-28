// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { connectToDatabase } from '@/lib/mongodb';

// This endpoint is now ONLY for forwarding the user's message to the webhook.
// Polling will be handled directly by the client against the events API.
const EVENTS_COLLECTION = 'events'; // This remains for potential future use or logging.

export async function POST(request: NextRequest) {
  try {
    const { assistantId, chatPath, message, executionId, destination } = await request.json();

    if (!chatPath || !message || !assistantId || !executionId || !destination) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos (assistantId, chatPath, message, executionId, destination).' }, { status: 400 });
    }
    
    // The new, dynamic webhook URL for sending the user's message.
    const CHAT_WEBHOOK_URL = `https://control.reptitalz.cloud/api/webhook/${chatPath}`;

    // Construct the payload according to the required format
    const payload = {
      assistantId,
      chatPath,
      executionId,
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
