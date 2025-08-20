
// src/app/api/create-collaborator-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { CollaboratorProfile } from '@/types';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const profileData: Pick<CollaboratorProfile, 'firebaseUid' | 'email' | 'firstName' | 'lastName'> = await request.json();

    if (!profileData || !profileData.firebaseUid || !profileData.email) {
      return NextResponse.json({ message: 'Datos de perfil de colaborador inválidos.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection<CollaboratorProfile>('collaboratorProfiles');

    // Check if collaborator already exists
    const existingCollaborator = await collection.findOne({ email: profileData.email });
    if (existingCollaborator) {
      return NextResponse.json({ message: "Este colaborador ya existe." }, { status: 409 }); // 409 Conflict
    }

    // Generate a unique referral code
    const referralCode = randomBytes(4).toString('hex').toUpperCase();

    const newCollaboratorProfile: Omit<CollaboratorProfile, '_id'> = {
      ...profileData,
      isAuthenticated: true, // Should be managed by session, but set true on creation
      referralCode,
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
