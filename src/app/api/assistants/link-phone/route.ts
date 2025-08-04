// src/app/api/assistants/link-phone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const { assistantId, phoneNumber, userDbId } = await request.json();

  if (!assistantId || !phoneNumber || !userDbId) {
    return NextResponse.json({ message: 'assistantId, phoneNumber, and userDbId are required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // 1. Update the assistant's phoneLinked number and reset verification status.
    const updateResult = await userProfileCollection.updateOne(
      { _id: new ObjectId(userDbId), "assistants.id": assistantId },
      {
        $set: {
          "assistants.$.phoneLinked": phoneNumber,
          "assistants.$.numberReady": false, // Mark as not ready until verified
        },
        $unset: {
            "assistants.$.verificationCode": "" // Clear any old verification code
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'Assistant not found for the given user' }, { status: 404 });
    }

    // 2. The verification code is now expected to be sent and set by an external process.
    // This endpoint no longer triggers a webhook.
    console.log(`Phone number ${phoneNumber} linked to assistant ${assistantId}. Awaiting external verification process.`);

    return NextResponse.json({ success: true, message: 'Phone number linked and verification process initiated.' });

  } catch (error) {
    console.error('API Error (link-phone):', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
