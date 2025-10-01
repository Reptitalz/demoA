
// src/app/api/create-user-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

function generateChatPath(name: string): string {
  if (!name) return `user-${Date.now()}`;
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${randomSuffix}`;
}

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

    // Ensure chatPath exists
    if (!profileData.chatPath) {
      const nameForPath = profileData.firstName || profileData.email.split('@')[0];
      profileData.chatPath = generateChatPath(nameForPath);
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
