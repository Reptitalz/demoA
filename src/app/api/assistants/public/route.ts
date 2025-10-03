// src/app/api/assistants/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';

// This public endpoint is used to fetch basic, shareable information about a user/assistant by their chatPath.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');

  if (!chatPath) {
    return NextResponse.json({ message: 'El parámetro chatPath es requerido.' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // It can be a user's personal chat path or an assistant's chat path
    const profile = await db.collection<UserProfile>('userProfiles').findOne(
        { $or: [{ chatPath: chatPath }, { "assistants.chatPath": chatPath }] },
        { projection: { 
            firstName: 1, 
            lastName: 1, 
            imageUrl: 1, 
            chatPath: 1,
            assistants: { $elemMatch: { chatPath: chatPath } } 
        } }
    );
    
    if (!profile) {
        return NextResponse.json({ message: 'No se encontró ningún perfil con ese ID de chat.' }, { status: 404 });
    }
    
    let publicProfile;

    // Determine if the chatPath belongs to a user or an assistant
    if (profile.chatPath === chatPath) {
        // It's a user's personal profile
        publicProfile = {
            name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Usuario',
            imageUrl: profile.imageUrl,
            chatPath: profile.chatPath,
        };
    } else if (profile.assistants && profile.assistants.length > 0) {
        // It's an assistant's profile
        const assistant = profile.assistants[0];
        publicProfile = {
            name: assistant.name,
            imageUrl: assistant.imageUrl,
            chatPath: assistant.chatPath,
        };
    } else {
         return NextResponse.json({ message: 'No se pudo determinar el perfil público.' }, { status: 404 });
    }

    return NextResponse.json({ assistant: publicProfile }); // Keep 'assistant' key for client compatibility

  } catch (error) {
    console.error('API Error (public profile):', error);
    return NextResponse.json({ message: 'Error al obtener el perfil público' }, { status: 500 });
  }
}
