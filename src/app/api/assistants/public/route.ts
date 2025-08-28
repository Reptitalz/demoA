// src/app/api/assistants/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { UserProfile } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chatPath = searchParams.get('chatPath');

  if (!chatPath) {
    return NextResponse.json({ message: 'chatPath query parameter is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // Find the user profile that contains the assistant with the matching chatPath
    const userProfile = await userProfileCollection.findOne({
      "assistants.chatPath": chatPath
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Assistant not found.' }, { status: 404 });
    }
    
    const assistant = userProfile.assistants.find(a => a.chatPath === chatPath);

    if (!assistant) {
        return NextResponse.json({ message: 'Assistant not found.' }, { status: 404 });
    }

    // Return only the public-facing information
    const publicAssistantData = {
      id: assistant.id,
      name: assistant.name,
      imageUrl: assistant.imageUrl,
      chatPath: assistant.chatPath,
    };

    return NextResponse.json({ assistant: publicAssistantData });

  } catch (error) {
    console.error('API Error (public assistant):', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
