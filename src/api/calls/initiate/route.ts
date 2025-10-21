// src/app/api/calls/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIo, getSocket } from '@/providers/SocketProvider'; // Assuming you have a way to get the socket instance

// THIS API ROUTE IS DEPRECATED AND WILL BE REMOVED.
// The call initiation logic is now handled directly by the Socket.IO server
// for a more efficient, real-time signaling flow.

export async function POST(req: NextRequest) {
  console.warn("DEPRECATION WARNING: The /api/calls/initiate endpoint is deprecated and should not be used. Call initiation is handled via WebSockets.");
  
  return NextResponse.json({ 
    success: false, 
    message: 'This endpoint is deprecated. Use a WebSocket event to initiate calls.' 
  }, { status: 410 });
}
