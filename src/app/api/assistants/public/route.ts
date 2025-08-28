// src/app/api/assistants/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile, AssistantConfig } from '@/types';

// This is a public endpoint, so no session check is needed.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');

  if (!chatPath) {
    return NextResponse.json({ message: 'chatPath query parameter is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Find a user profile that contains an assistant with the matching chatPath
    const userWithAssistant = await db.collection<UserProfile>('userProfiles').findOne({
      'assistants.chatPath': chatPath,
    });

    if (!userWithAssistant) {
      return NextResponse.json({ message: 'Assistant not found.' }, { status: 404 });
    }

    // Find the specific assistant from the user's assistants array
    const assistant = userWithAssistant.assistants.find(a => a.chatPath === chatPath);

    if (!assistant) {
        // This case should be rare if the above query is correct, but it's a good safeguard
        return NextResponse.json({ message: 'Assistant data could not be located in profile.' }, { status: 404 });
    }

    // Return only the necessary public information about the assistant
    const publicAssistantData = {
        id: assistant.id,
        name: assistant.name,
        imageUrl: assistant.imageUrl,
        chatPath: assistant.chatPath,
    };
    
    return NextResponse.json({ assistant: publicAssistantData });

  } catch (error) {
    console.error("API GET Error (public assistant):", error);
    return NextResponse.json({ message: 'Failed to fetch assistant info due to an internal error' }, { status: 500 });
  }
}
