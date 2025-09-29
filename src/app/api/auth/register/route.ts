
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import bcrypt from 'bcryptjs';

function generateChatPath(assistantName: string): string {
  const slug = assistantName
    .toLowerCase()
    // remove accents, swap ñ for n, etc
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // remove invalid chars
    .replace(/[^a-z0-9 -]/g, '')
    // collapse whitespace and replace by -
    .replace(/\s+/g, '-')
    // collapse dashes
    .replace(/-+/g, '-');
  
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${randomSuffix}`;
}


export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Se requieren correo electrónico y contraseña.' }, { status: 400 });
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

    const assistantName = "Mi Primer Asistente";

    const newAssistant: AssistantConfig = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: assistantName,
        type: 'desktop', // Always create a desktop assistant
        prompt: "Eres un asistente amigable y servicial. Tu objetivo es responder preguntas de manera clara y concisa.",
        purposes: [],
        isActive: true, // Active for free trial
        numberReady: true, // Ready for free trial
        messageCount: 0,
        monthlyMessageLimit: 10000, // High limit for trial
        imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
        chatPath: generateChatPath(assistantName),
        isFirstDesktopAssistant: true, // This is their first one
        trialStartDate: new Date().toISOString(),
    };
    
    const newUserProfile: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
      firebaseUid: '', // Not using Firebase for this auth method
      authProvider: 'email',
      email,
      password: hashedPassword,
      assistants: [newAssistant],
      databases: [],
      credits: 0, // No credits given on signup
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
