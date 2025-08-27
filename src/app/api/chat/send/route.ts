// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CHAT_API_URL = 'https://control.reptitalz.cloud/api/v1/chat';

export async function POST(request: NextRequest) {
  try {
    const { assistantId, chatPath, message, executionId, destination } = await request.json();

    if (!assistantId || !chatPath || !message || !executionId || !destination) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    const payload = {
      assistantId,
      chatPath,
      executionId,
      message,
      destination,
    };

    // Forward the request to the actual chat service
    // We don't wait for the response here as per the instructions.
    // The client will handle polling for the response.
    axios.post(CHAT_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000 // 5-second timeout to avoid hanging
    }).catch(error => {
        // We log the error but don't want to block the client response
        console.error(`Error forwarding chat message to ${CHAT_API_URL}:`, error.message);
    });

    // Immediately confirm to the client that the message has been dispatched
    return NextResponse.json({ success: true, message: 'Mensaje enviado para procesamiento.' });

  } catch (error: any) {
    console.error('API Error (api/chat/send):', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
