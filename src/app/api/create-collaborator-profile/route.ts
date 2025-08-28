// src/app/api/create-collaborator-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { CollaboratorProfile } from '@/types';
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

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: 'Se requieren todos los campos del perfil.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<CollaboratorProfile>('collaboratorProfiles');

    // Check if collaborator already exists
    const existingCollaborator = await collection.findOne({ email });
    if (existingCollaborator) {
      return NextResponse.json({ message: "Este colaborador ya existe." }, { status: 409 });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newCollaboratorProfile: Omit<CollaboratorProfile, '_id'> = {
      firebaseUid: '', // Not used for credential-based collaborators
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isAuthenticated: true,
      referralCode: generateReferralCode(),
      referredUsers: [],
      totalEarnings: 0,
      conversionRate: 0,
    };

    const insertResult = await collection.insertOne(newCollaboratorProfile as CollaboratorProfile);

    if (!insertResult.insertedId) {
      throw new Error("No se pudo insertar el perfil de colaborador en la base de datos.");
    }
    
    const createdProfile: CollaboratorProfile = {
        ...newCollaboratorProfile,
        _id: insertResult.insertedId,
    };

    return NextResponse.json({ collaboratorProfile: createdProfile }, { status: 201 });

  } catch (error) {
    console.error("API Error (create-collaborator-profile):", error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
