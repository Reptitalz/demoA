// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { connectToDatabase } from '@/lib/mongodb';

// The new webhook URL for the chat service
const CHAT_WEBHOOK_URL = 'https://control.reptitalz.cloud/api/v1/chat';
const EVENTS_COLLECTION = 'events'; // Collection where assistant responses are stored

export async function POST(request: NextRequest) {
  try {
    const { assistantId, chatPath, message, executionId, destination, poll } = await request.json();

    if (!chatPath || !executionId || !destination) {
      return NextResponse.json({ message: 'Faltan parámetros requeridos (chatPath, executionId, destination).' }, { status: 400 });
    }

    // --- Polling Logic ---
    if (poll) {
      const { db } = await connectToDatabase();
      const event = await db.collection(EVENTS_COLLECTION).findOneAndDelete({
        "data.destination": destination,
        "data.type": "assistant_response" // Look for responses from the assistant
      });

      if (event) {
        // Found a response, return it to the client
        return NextResponse.json({ success: true, message: event.data.message });
      } else {
        // No new message found for this destination yet
        return NextResponse.json({ success: true, message: null });
      }
    }

    // --- Sending Logic ---
    if (!message || !assistantId) {
      return NextResponse.json({ message: 'Los parámetros "message" y "assistantId" son requeridos para enviar.' }, { status: 400 });
    }
    
    // Construct the payload according to the new format
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
