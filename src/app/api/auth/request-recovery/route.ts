import { NextRequest, NextResponse } from 'next/server';
import { sendRecoveryWebhook } from '@/services/recoveryWebhookService';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, method } = await request.json();

    if (!phoneNumber || !method) {
      return NextResponse.json({ message: 'El número de teléfono y el método son requeridos' }, { status: 400 });
    }

    // 1. Verify user exists
    const { db } = await connectToDatabase();
    const user = await db.collection<UserProfile>('userProfiles').findOne({ phoneNumber });

    if (!user) {
      // Don't reveal that the user doesn't exist for security, but log it.
      console.warn(`Intento de recuperación de contraseña para número no registrado: ${phoneNumber}`);
      // Still return a success-like message to prevent user enumeration attacks.
      return NextResponse.json({ message: 'Si tu número está registrado, recibirás un enlace de recuperación.' });
    }

    // 2. Trigger the webhook service
    await sendRecoveryWebhook(phoneNumber, method);

    return NextResponse.json({ message: 'Solicitud de recuperación enviada exitosamente.' });

  } catch (error) {
    console.error('API Error (auth/request-recovery):', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
