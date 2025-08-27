
// src/app/api/assistants/public/[assistantSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

// This public endpoint finds an assistant by its unique `chatPath` slug.
export async function GET(request: NextRequest, { params }: { params: { assistantSlug: string } }) {
  const { assistantSlug } = params;
  
  if (!assistantSlug) {
    return NextResponse.json({ message: 'Se requiere el slug del asistente.' }, { status: 400 });
  }
  
  try {
    const { db } = await connectToDatabase();
    
    // Construct the full chat path to search for
    const chatPath = `/chat/${assistantSlug}`;
    
    // Find the user profile that contains the assistant with the matching chatPath
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne(
      { 'assistants.chatPath': chatPath },
      { projection: { 'assistants.$': 1 } } // Project only the matching assistant
    );

    if (userProfile && userProfile.assistants && userProfile.assistants.length > 0) {
      const assistant = userProfile.assistants[0];
      
      // Return only a subset of the assistant's data for public consumption
      const publicAssistantData = {
        id: assistant.id,
        name: assistant.name,
        imageUrl: assistant.imageUrl,
        chatPath: assistant.chatPath,
      };
      
      return NextResponse.json({ assistant: publicAssistantData });
    } else {
      return NextResponse.json({ message: 'Asistente no encontrado o no disponible.' }, { status: 404 });
    }
  } catch (error) {
    console.error("API GET Public Assistant Error:", error);
    return NextResponse.json({ message: 'Error al obtener la información del asistente.' }, { status: 500 });
  }
}
