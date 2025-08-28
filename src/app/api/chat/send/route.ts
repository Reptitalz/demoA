// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { connectToDatabase } from '@/lib/mongodb';

// The base domain for the webhook
const WEBHOOK_DOMAIN = 'https://control.reptitalz.cloud/api/webhook';
const EVENTS_COLLECTION = 'events'; // Assuming your events are stored here

export async function POST(request: NextRequest) {
  try {
    const { chatPath, message, executionId, destination, poll } = await request.json();

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
    if (!message) {
      return NextResponse.json({ message: 'El parámetro "message" es requerido para enviar.' }, { status: 400 });
    }
    
    // Construct the dynamic webhook URL
    const webhookUrl = `${WEBHOOK_DOMAIN}/${chatPath}`;

    const payload = {
      message,
      destination,
      executionId,
    };

    // Asynchronously forward the request to the external webhook
    axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000 // 5-second timeout
    }).catch(error => {
        // We log the error but don't want to block the client response
        console.error(`Error forwarding chat message to ${webhookUrl}:`, error.message);
    });

    // Immediately confirm to the client that the message has been dispatched for processing
    return NextResponse.json({ success: true, message: 'Mensaje enviado para procesamiento.' });

  } catch (error: any) {
    console.error('API Error (api/chat/send):', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
