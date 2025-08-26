// src/app/api/assistants/public/[assistantId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';

// This endpoint is for public access to minimal assistant details.
// It finds the assistant across all user profiles.
export async function GET(request: NextRequest, { params }: { params: { assistantId: string } }) {
  const { assistantId } = params;

  if (!assistantId) {
    return NextResponse.json({ message: 'Assistant ID is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // Find the user profile that contains the assistant with the given ID.
    const userProfile = await userProfileCollection.findOne({ "assistants.id": assistantId });

    if (!userProfile) {
      return NextResponse.json({ message: 'Assistant not found' }, { status: 404 });
    }

    const assistant = userProfile.assistants.find(a => a.id === assistantId);

    if (!assistant) {
      // This case should theoretically not happen if the findOne query succeeded, but it's good practice.
      return NextResponse.json({ message: 'Assistant not found within the user profile' }, { status: 404 });
    }
    
    if (!assistant.isActive) {
        return NextResponse.json({ message: 'This assistant is not currently active.' }, { status: 403 });
    }
    
    // Return only the necessary public information about the assistant.
    // DO NOT return the entire user profile or sensitive assistant config like prompts.
    const publicAssistantData: Partial<AssistantConfig> = {
        id: assistant.id,
        name: assistant.name,
        imageUrl: assistant.imageUrl,
        type: assistant.type,
    };

    return NextResponse.json({ assistant: publicAssistantData });

  } catch (error) {
    console.error(`API Error (public/assistants/${assistantId}):`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
