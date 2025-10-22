
// src/app/api/create-user-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';

function generateChatPath(name: string): string {
  if (!name) return `user-${Date.now()}`;
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${randomSuffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const profileData: Partial<Omit<UserProfile, '_id' | 'isAuthenticated'>> & { firebaseUid: string; email: string; firstName?: string; imageUrl?: string } = await request.json();

    if (!profileData || !profileData.firebaseUid || !profileData.email) {
      return NextResponse.json({ message: 'Datos de perfil inválidos.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>('userProfiles');

    // Check if user already exists to prevent duplicates
    const existingUser = await userCollection.findOne({ email: profileData.email });
    if (existingUser) {
        return NextResponse.json({ userProfile: existingUser, message: "El usuario ya existe." }, { status: 200 });
    }
    
    const userName = profileData.firstName || profileData.email.split('@')[0];

    // This flow is for the "Hey Manito App" (chat), so we create a 'desktop' assistant
    // which represents the user's own chat profile.
    const personalChatAssistant: AssistantConfig = {
      id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: userName,
      type: 'desktop',
      prompt: "Este es un perfil de usuario, no un bot. No respondas automáticamente.",
      purposes: [],
      isActive: true,
      numberReady: true,
      messageCount: 0,
      monthlyMessageLimit: 10000,
      imageUrl: profileData.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
      chatPath: generateChatPath(userName),
      isFirstDesktopAssistant: true,
      trialStartDate: new Date().toISOString(),
      accountType: 'personal',
    };

    const finalProfileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
      firebaseUid: profileData.firebaseUid,
      email: profileData.email,
      firstName: userName,
      lastName: profileData.lastName || '',
      imageUrl: profileData.imageUrl,
      chatPath: generateChatPath(`user-${userName}`),
      assistants: [personalChatAssistant],
      databases: [],
      catalogs: [],
      credits: 0,
      purchasedUnlimitedPlans: 0,
      authProvider: 'google',
      accountType: 'personal',
    };

    const insertResult = await userCollection.insertOne(finalProfileData as UserProfile);

    if (!insertResult.insertedId) {
      throw new Error("No se pudo insertar el perfil de usuario en la base de datos.");
    }
    
    const createdProfile: UserProfile = {
        ...finalProfileData,
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
