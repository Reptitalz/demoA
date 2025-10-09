
// src/app/api/assistants/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile, AssistantConfig } from '@/types';

// This endpoint is used by the public chat page to get basic assistant details.
// It should only return non-sensitive information.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');

  if (!chatPath) {
    return NextResponse.json({ message: 'Se requiere el chatPath del asistente' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Find the user profile that contains the assistant with the matching chatPath
    const user = await db.collection<UserProfile>('userProfiles').findOne({ 
      "assistants.chatPath": chatPath
    });

    if (!user || !user.assistants) {
      return NextResponse.json({ message: 'Asistente no encontrado' }, { status: 404 });
    }
    
    const assistant = user.assistants.find(a => a.chatPath === chatPath);
    
    if (!assistant) {
      return NextResponse.json({ message: 'Asistente no encontrado' }, { status: 404 });
    }

    // Return a slimmed-down, public version of the assistant object
    const publicAssistant: Partial<AssistantConfig> & { accountType?: 'personal' | 'business' } = {
        id: assistant.id,
        name: assistant.name,
        type: assistant.type,
        imageUrl: assistant.imageUrl,
        businessInfo: assistant.businessInfo,
        catalogId: assistant.catalogId,
        isActive: assistant.isActive, // Important for the client to know if it can receive messages
        chatPath: assistant.chatPath,
        accountType: user.accountType, // Pass the owner's account type
    };
    
    return NextResponse.json({ assistant: publicAssistant });

  } catch (error) {
    console.error('API Error (public/assistants):', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
