
import { NextRequest, NextResponse } from 'next/server';
import { sendRecoveryWebhook } from '@/services/recoveryWebhookService';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import crypto from 'crypto';

const TOKEN_EXPIRATION_MINUTES = 15;

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

    // 2. Generate a secure token and store it in the user's document
    const token = crypto.randomBytes(32).toString('hex');
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + TOKEN_EXPIRATION_MINUTES);

    const result = await db.collection<UserProfile>('userProfiles').updateOne(
      { phoneNumber: phoneNumber },
      { $set: { recoveryToken: token, recoveryTokenExpiry: expirationDate } }
    );

    if (result.matchedCount === 0) {
      throw new Error("No se pudo actualizar el usuario para el proceso de recuperación.");
    }
    
    // 3. Trigger the webhook service to send the link
    await sendRecoveryWebhook(phoneNumber, method, token);

    return NextResponse.json({ message: 'Solicitud de recuperación enviada exitosamente.' });

  } catch (error) {
    console.error('API Error (auth/request-recovery):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
