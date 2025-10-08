// src/app/api/calls/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getIo, getSocket } from '@/providers/SocketProvider'; // Assuming you have a way to get the socket instance

export async function POST(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!session || !session.sub) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { recipientId, recipientInfo, callerInfo } = await req.json();

  if (!recipientId) {
    return NextResponse.json({ message: 'Se requiere el ID del destinatario' }, { status: 400 });
  }

  // Generate a unique room name for the call
  const roomName = `call_${session.sub}_${recipientId}_${Date.now()}`;
  
  const io = getIo(); // You need to implement getIo() to retrieve the server instance

  if (io) {
    // Emit 'incomingCall' event to the recipient's room (assuming they join a room with their user ID)
    io.to(recipientId).emit('incomingCall', {
      roomName,
      callerId: session.sub,
      callerInfo: callerInfo,
    });
    
     // Also notify the caller so their UI can update
    io.to(session.sub).emit('callInitiated', { roomName, recipientId, recipientInfo });

    return NextResponse.json({ success: true, roomName });
  } else {
    return NextResponse.json({ message: 'Servidor de socket no está disponible' }, { status: 500 });
  }

}
