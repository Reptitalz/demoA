// src/app/api/assistants/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile, AssistantConfig } from '@/types';
import { ObjectId } from 'mongodb';

// This is a public endpoint to find a user or an assistant by their chatPath.
// It only returns non-sensitive information.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');

  if (!chatPath) {
    return NextResponse.json({ message: 'Se requiere el parámetro chatPath' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // First, try to find a user profile with this chatPath
    const userProfileCollection = db.collection<UserProfile>('userProfiles');
    const user = await userProfileCollection.findOne({ chatPath });

    if (user) {
        // Found a user. Return public user data.
        const publicUserData = {
            id: user._id.toString(),
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            imageUrl: user.imageUrl,
            chatPath: user.chatPath,
            // You can add other public fields here if needed
        };
        return NextResponse.json({ assistant: publicUserData });
    }

    // If not found, try to find an assistant with this chatPath
    const assistant = await userProfileCollection.findOne(
      { "assistants.chatPath": chatPath },
      { projection: { "assistants.$": 1 } }
    );
    
    if (assistant && assistant.assistants && assistant.assistants.length > 0) {
      const foundAssistant = assistant.assistants[0];
      // Return public assistant data
      const publicAssistantData = {
          id: foundAssistant.id,
          name: foundAssistant.name,
          imageUrl: foundAssistant.imageUrl,
          chatPath: foundAssistant.chatPath,
          prompt: foundAssistant.prompt, // Prompt might be needed for initial interaction
          accountType: foundAssistant.accountType,
          businessInfo: foundAssistant.businessInfo,
      };
      return NextResponse.json({ assistant: publicAssistantData });
    }

    // If neither a user nor an assistant is found
    return NextResponse.json({ message: 'No se encontró ningún usuario o asistente con ese ID de chat.' }, { status: 404 });

  } catch (error) {
    console.error('API Error (GET /api/assistants/public):', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
