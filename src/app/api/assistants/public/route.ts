// src/app/api/assistants/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';

// This public endpoint fetches the minimal necessary assistant config
// to display on a public-facing chat page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');

  if (!chatPath) {
    return NextResponse.json({ message: 'Se requiere el chatPath del asistente.' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Find the user profile that contains the assistant with the matching chatPath
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne(
      { "assistants.chatPath": chatPath },
      { 
        projection: { 
          'assistants.$': 1, // Only get the matching assistant from the array
          'accountType': 1, // Get the user's account type
        }
      }
    );

    if (!userProfile || !userProfile.assistants || userProfile.assistants.length === 0) {
      return NextResponse.json({ message: 'Asistente no encontrado.' }, { status: 404 });
    }

    const assistant = userProfile.assistants[0];

    // Return only the necessary public information
    const publicAssistantData = {
      id: assistant.id,
      name: assistant.name,
      imageUrl: assistant.imageUrl,
      isActive: assistant.isActive,
      chatPath: assistant.chatPath,
      businessInfo: assistant.businessInfo,
    };
    
    const accountType = userProfile.accountType || 'personal';

    return NextResponse.json({ assistant: publicAssistantData, accountType });

  } catch (error) {
    console.error('API Error (GET /api/assistants/public):', error);
    return NextResponse.json({ message: 'Error al obtener la información del asistente.' }, { status: 500 });
  }
}
