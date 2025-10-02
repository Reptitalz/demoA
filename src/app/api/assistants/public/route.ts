// src/app/api/assistants/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile, AssistantConfig } from '@/types';

// This endpoint is for PUBLICLY fetching a user or assistant's
// basic contact info using their unique chatPath.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');

  if (!chatPath) {
    return NextResponse.json({ message: 'Se requiere el parámetro chatPath.' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Search can match either a user's personal chatPath or an assistant's chatPath
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne(
      { $or: [{ chatPath: chatPath }, { "assistants.chatPath": chatPath }] },
      { 
        projection: { 
          'firstName': 1, 
          'lastName': 1,
          'imageUrl': 1,
          'chatPath': 1, 
          'assistants.name': 1,
          'assistants.imageUrl': 1,
          'assistants.chatPath': 1,
        } 
      }
    );

    if (!userProfile) {
      return NextResponse.json({ message: 'No se encontró ningún perfil con ese ID de chat.' }, { status: 404 });
    }

    let publicProfile;

    // Check if the chatPath matches an assistant
    const assistantMatch = userProfile.assistants?.find(a => a.chatPath === chatPath);
    
    if (assistantMatch) {
      // It's an assistant's profile
      publicProfile = {
        name: assistantMatch.name,
        imageUrl: assistantMatch.imageUrl,
        chatPath: assistantMatch.chatPath,
      };
    } else {
      // It's a user's personal profile
      publicProfile = {
        name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'Usuario Anónimo',
        imageUrl: userProfile.imageUrl,
        chatPath: userProfile.chatPath,
      };
    }
    
    // We are returning it wrapped in an 'assistant' object to match
    // the client-side expectation from `handleAddContact`
    return NextResponse.json({ assistant: publicProfile });

  } catch (error) {
    console.error('API Error (GET /api/assistants/public):', error);
    return NextResponse.json({ message: 'Error al buscar el perfil.' }, { status: 500 });
  }
}
