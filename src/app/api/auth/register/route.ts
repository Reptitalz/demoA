
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, assistantType } = await request.json();

    if (!email || !password || !assistantType) {
      return NextResponse.json({ message: 'Se requieren correo electrónico, contraseña y tipo de asistente.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userCollection = db.collection<UserProfile>('userProfiles');

    // Check if user already exists
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Este correo electrónico ya está registrado." }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const isDesktopAssistant = assistantType === 'desktop';
    const newAssistant: AssistantConfig = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: isDesktopAssistant ? "Mi Asistente de Escritorio" : "Mi Asistente de WhatsApp",
        type: assistantType,
        prompt: "Eres un asistente amigable y servicial. Tu objetivo es responder preguntas de manera clara y concisa.",
        purposes: [],
        isActive: isDesktopAssistant,
        numberReady: isDesktopAssistant,
        messageCount: 0,
        monthlyMessageLimit: isDesktopAssistant ? 1000 : 0,
        imageUrl: DEFAULT_ASSISTANT_IMAGE_URL
    };
    
    const newUserProfile: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
      firebaseUid: '', // Not using Firebase for this auth method
      authProvider: 'email',
      email,
      password: hashedPassword,
      assistants: [newAssistant],
      databases: [],
      credits: isDesktopAssistant ? 1 : 0,
    };

    const insertResult = await userCollection.insertOne(newUserProfile as UserProfile);

    if (!insertResult.insertedId) {
      throw new Error("No se pudo registrar al usuario en la base de datos.");
    }
    
    return NextResponse.json({ message: "Usuario registrado exitosamente." }, { status: 201 });

  } catch (error) {
    console.error("API Error (register):", error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
