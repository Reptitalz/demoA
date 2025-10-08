// src/app/api/livekit/get-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getToken } from 'next-auth/jwt';

const livekitHost = process.env.LIVEKIT_URL || '';
const livekitApiKey = process.env.LIVEKIT_API_KEY || '';
const livekitApiSecret = process.env.LIVEKIT_API_SECRET || '';

export async function POST(req: NextRequest) {
  const sessionToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!sessionToken || !sessionToken.sub) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  
  const { roomName, identity } = await req.json();

  if (!roomName || !identity) {
    return NextResponse.json({ message: 'Se requieren el nombre de la sala y la identidad del participante' }, { status: 400 });
  }
  
  // The identity of the participant must match the authenticated user's ID
  if (identity !== sessionToken.sub) {
     return NextResponse.json({ message: 'La identidad no coincide con el usuario autenticado' }, { status: 403 });
  }

  if (!livekitApiKey || !livekitApiSecret || !livekitHost) {
      console.error("LiveKit server environment variables not configured.");
      return NextResponse.json({ message: 'Configuración del servidor de LiveKit incompleta.' }, { status: 500 });
  }

  const at = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: identity,
  });

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  const token = await at.toJwt();

  return NextResponse.json({ token });
}
