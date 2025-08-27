// src/app/api/assistants/public/[chatPath]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatPath: string } }
) {
  const { chatPath } = params;

  if (!chatPath) {
    return NextResponse.json({ message: 'El chatPath es requerido' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();

    // We need to find the user profile that contains the assistant with the matching chatPath
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne({
      "assistants.chatPath": `/chat/${chatPath}`
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Asistente no encontrado' }, { status: 404 });
    }

    const assistant = userProfile.assistants.find(a => a.chatPath === `/chat/${chatPath}`);

    if (!assistant) {
      return NextResponse.json({ message: 'Asistente no encontrado' }, { status: 404 });
    }
    
    if (!assistant.isActive) {
       return NextResponse.json({ message: 'Este asistente no está activo actualmente.' }, { status: 403 });
    }

    // Return only public-safe information
    const publicAssistantData = {
      id: assistant.id,
      name: assistant.name,
      imageUrl: assistant.imageUrl,
      chatPath: assistant.chatPath,
    };

    return NextResponse.json({ assistant: publicAssistantData });

  } catch (error) {
    console.error('API Error (public/assistant):', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}