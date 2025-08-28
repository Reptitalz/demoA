
// src/app/api/assistants/public/[chatPath]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';

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

    // Find the user profile that contains the assistant with the matching chatPath
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne(
      { "assistants.chatPath": chatPath },
      {
        projection: {
          'assistants.$': 1, // Project only the matched assistant from the array
        },
      }
    );

    if (!userProfile || !userProfile.assistants || userProfile.assistants.length === 0) {
      return NextResponse.json({ message: 'Asistente no encontrado' }, { status: 404 });
    }

    const assistant = userProfile.assistants[0];

    // Ensure the assistant is a desktop type and is active
    if (assistant.type !== 'desktop' || !assistant.isActive) {
        return NextResponse.json({ message: 'Este asistente no está disponible para chatear.' }, { status: 403 });
    }

    // Return only the necessary public data
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
