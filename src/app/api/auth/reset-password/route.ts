
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'El token y la nueva contraseña son requeridos' }, { status: 400 });
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>('userProfiles');

    // Find user by the reset token and check if it's not expired
    const user = await userCollection.findOne({
      recoveryToken: token,
      recoveryTokenExpiry: { $gt: new Date() } // Check if the token expiry is in the future
    });

    if (!user) {
      return NextResponse.json({ message: 'El enlace de recuperación es inválido o ha expirado.' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update the password and invalidate the token by removing it
    const result = await userCollection.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { recoveryToken: "", recoveryTokenExpiry: "" }
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error('No se pudo actualizar la contraseña.');
    }

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente.' });

  } catch (error) {
    console.error('API Error (auth/reset-password):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
