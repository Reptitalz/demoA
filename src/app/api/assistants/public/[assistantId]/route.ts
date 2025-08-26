
// src/app/api/assistants/public/[assistantId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { assistantId: string } }
) {
  const { assistantId } = params;

  if (!assistantId) {
    return NextResponse.json({ message: 'Assistant ID is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // Find the user profile that contains the assistant with the given ID
    const userProfile = await userProfileCollection.findOne({
      "assistants.id": assistantId,
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Assistant not found' }, { status: 404 });
    }

    const assistant = userProfile.assistants.find(a => a.id === assistantId);

    if (!assistant) {
      // This should theoretically not happen if the query above succeeds, but it's a good safeguard.
      return NextResponse.json({ message: 'Assistant not found within profile' }, { status: 404 });
    }
    
    if (!assistant.isActive) {
      return NextResponse.json({ message: 'This assistant is currently not active.' }, { status: 403 });
    }

    // Return only the public-safe information about the assistant
    const publicAssistantData = {
      id: assistant.id,
      name: assistant.name,
      imageUrl: assistant.imageUrl,
      type: assistant.type,
    };

    return NextResponse.json({ assistant: publicAssistantData });

  } catch (error) {
    console.error(`API Error (public/assistant/${assistantId}):`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
