// src/app/api/user-profile/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';

// This endpoint is for PUBLIC lookups of user/assistant profiles by chatPath.
// It should only return non-sensitive information.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');
  
  if (!chatPath) {
    return NextResponse.json({ message: 'Se requiere el parámetro "chatPath"' }, { status: 400 });
  }
  
  try {
    const { db } = await connectToDatabase();
    
    // First, try to find a user with this chatPath
    let profile = await db.collection<UserProfile>('userProfiles').findOne(
      { chatPath: chatPath },
      { projection: { firstName: 1, lastName: 1, imageUrl: 1, chatPath: 1, accountType: 1 } }
    );
    
    // If not found, try to find an assistant with this chatPath
    if (!profile) {
        profile = await db.collection<UserProfile>('userProfiles').findOne(
            { "assistants.chatPath": chatPath },
            // Project to get the specific assistant's details
            { projection: { "assistants.$": 1 } }
        );
        
        if (profile && profile.assistants && profile.assistants.length > 0) {
            const assistant = profile.assistants[0];
            // Reshape the assistant data to look like a user profile for consistency
             return NextResponse.json({ 
                profile: {
                    name: assistant.name,
                    imageUrl: assistant.imageUrl,
                    chatPath: assistant.chatPath,
                    accountType: assistant.accountType,
                }
            });
        }
    }


    if (profile) {
      // Reshape the user data for consistency
      const publicProfile = {
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        imageUrl: profile.imageUrl,
        chatPath: profile.chatPath,
        accountType: profile.accountType
      };
      return NextResponse.json({ profile: publicProfile });
    } else {
      return NextResponse.json({ profile: null, message: "Perfil no encontrado" }, { status: 404 });
    }
  } catch (error) {
    console.error("API GET Public Profile Error:", error);
    return NextResponse.json({ message: 'Error interno al buscar el perfil' }, { status: 500 });
  }
}
