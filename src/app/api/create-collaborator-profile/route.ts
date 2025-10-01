// src/app/api/create-collaborator-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { CollaboratorProfile, UserProfile } from '@/types';
import bcrypt from 'bcryptjs';

// Helper function to generate a unique referral code without using Node.js crypto
function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateChatPath(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${randomSuffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: 'Se requieren todos los campos del perfil.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collaboratorCollection = db.collection<CollaboratorProfile>('collaboratorProfiles');
    const userCollection = db.collection<UserProfile>('userProfiles');

    // Check if user already exists in either collection
    const existingCollaborator = await collaboratorCollection.findOne({ email });
    const existingUser = await userCollection.findOne({ email });
    if (existingCollaborator || existingUser) {
      return NextResponse.json({ message: "Este correo electrónico ya está registrado." }, { status: 409 });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`;

    const newUserProfile: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
      firebaseUid: '', // Will be updated on first login
      authProvider: 'email',
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isAuthenticated: false, // Will be true on first login
      chatPath: generateChatPath(fullName),
      assistants: [],
      databases: [],
      credits: 0,
      accountType: 'business', // Collaborators are business accounts
      referredBy: generateReferralCode(), // Use referral code to mark as collaborator
    };

    const insertResult = await userCollection.insertOne(newUserProfile as UserProfile);

    if (!insertResult.insertedId) {
      throw new Error("No se pudo insertar el perfil de colaborador en la base de datos.");
    }
    
    const createdProfile: UserProfile = {
        ...newUserProfile,
        _id: insertResult.insertedId,
        isAuthenticated: true,
    };

    return NextResponse.json({ userProfile: createdProfile }, { status: 201 });

  } catch (error) {
    console.error("API Error (create-collaborator-profile):", error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
