
// src/app/api/create-user-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const profileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = await request.json();

    if (!profileData || !profileData.firebaseUid || !profileData.email) {
      return NextResponse.json({ message: 'Datos de perfil inválidos.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>('userProfiles');

    // Check if user already exists to prevent duplicates
    const existingUser = await userCollection.findOne({ email: profileData.email });
    if (existingUser) {
        // This case can happen in a race condition or if user retries.
        // Return the existing profile.
        return NextResponse.json({ userProfile: existingUser, message: "El usuario ya existe." }, { status: 200 });
    }

    const insertResult = await userCollection.insertOne(profileData as UserProfile);

    if (!insertResult.insertedId) {
      throw new Error("No se pudo insertar el perfil de usuario en la base de datos.");
    }
    
    const createdProfile: UserProfile = {
        ...profileData,
        _id: insertResult.insertedId,
        isAuthenticated: true,
    };

    return NextResponse.json({ userProfile: createdProfile }, { status: 201 });

  } catch (error) {
    console.error("API Error (create-user-profile):", error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
