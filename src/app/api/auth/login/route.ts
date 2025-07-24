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

    // Find the user by phone number
    const user = await userProfileCollection.findOne({ phoneNumber: phoneNumber });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 404 });
    }
    
    // User must have a password to log in with this method.
    if (!user.password) {
        return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 401 });
    }

    // Use bcrypt to compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Usuario no encontrado o credenciales incorrectas.' }, { status: 401 });
    }

    // Remove password before sending the profile to the client
    const { password: _, ...userProfileWithoutPassword } = user;
    const profileToSend = { ...userProfileWithoutPassword, isAuthenticated: true };


    return NextResponse.json({ 
        message: 'Login successful', 
        userProfile: profileToSend
    });

  } catch (error) {
    console.error('API Error (auth/login):', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
