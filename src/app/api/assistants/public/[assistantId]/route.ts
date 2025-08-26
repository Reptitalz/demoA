// src/app/api/assistants/public/[assistantId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { assistantId: string } }
) {
  const assistantId = params.assistantId;

  if (!assistantId) {
    return NextResponse.json({ message: 'Assistant ID is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Find the user profile that contains the assistant with the given ID.
    const userProfile = await db.collection<UserProfile>('userProfiles').findOne(
      { "assistants.id": assistantId },
      {
        projection: {
          'assistants.$': 1, // Project only the matched assistant from the array
        },
      }
    );

    if (!userProfile || !userProfile.assistants || userProfile.assistants.length === 0) {
      return NextResponse.json({ message: 'Assistant not found' }, { status: 404 });
    }

    const assistant = userProfile.assistants[0];

    // Return only public-safe information
    const publicAssistantData = {
      id: assistant.id,
      name: assistant.name,
      imageUrl: assistant.imageUrl,
      type: assistant.type,
      prompt: assistant.prompt, // Prompt is needed for conversation
    };

    return NextResponse.json(publicAssistantData);
  } catch (error) {
    console.error('API Error (public/assistant):', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
