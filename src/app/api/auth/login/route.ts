import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import bcrypt from 'bcrypt';

const PROFILES_COLLECTION = 'userProfiles';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, password } = await request.json();

    if (!phoneNumber || !password) {
      return NextResponse.json({ message: 'Phone number and password are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    const user = await userProfileCollection.findOne({ phoneNumber: phoneNumber });

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 401 });
    }
    
    if (!user.firebaseUid) {
        console.error(`User ${user.phoneNumber} is missing firebaseUid.`);
        return NextResponse.json({ message: 'Error de configuración de la cuenta. Falta el identificador de usuario.' }, { status: 500 });
    }
    
    // Omit password from the response
    const { password: _, ...userProfileWithoutPassword } = user;

    return NextResponse.json({ 
        message: 'Login successful', 
        userProfile: { ...userProfileWithoutPassword, isAuthenticated: true },
    });

  } catch (error) {
    console.error('API Error (auth/login):', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
