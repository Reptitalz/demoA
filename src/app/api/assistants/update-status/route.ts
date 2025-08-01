// src/app/api/assistants/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const { assistantId, phoneNumber, verificationCode, userDbId } = await request.json();
  if (!assistantId || !phoneNumber || !verificationCode || !userDbId) {
    return NextResponse.json({ message: 'assistantId, phoneNumber, verificationCode, and userDbId are required' }, { status: 400 });
  }

  // Simulate a short delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');

    // Always set the verification code that was attempted
    await userProfileCollection.updateOne(
        { _id: new ObjectId(userDbId), "assistants.id": assistantId },
        { $set: { "assistants.$.verificationCode": verificationCode } }
    );
    
    let updateOperation;

    // Custom logic based on verification code prefix
    if (verificationCode.startsWith('A')) {
      // Success case: Activate the assistant
      updateOperation = {
        $set: { 
          "assistants.$.numberReady": true,
          "assistants.$.phoneLinked": phoneNumber, // ensure phone is set
        }
      };
      console.log(`Activating assistant ${assistantId} for user ${userDbId}`);
    } else if (verificationCode.startsWith('B')) {
      // Failure case: Reset the assistant's phone details
      updateOperation = {
        $set: {
            "assistants.$.numberReady": false, // explicitly set to false
        },
        $unset: { 
          "assistants.$.phoneLinked": "", 
          "assistants.$.verificationCode": "" 
        }
      };
      console.log(`Activation failed for assistant ${assistantId}. Resetting phone details.`);
    } else {
      // For any other code, just save it and mark as not ready. No error is thrown.
      updateOperation = {
        $set: {
          "assistants.$.numberReady": false,
          "assistants.$.verificationCode": verificationCode,
        },
      };
      console.log(`Verification code ${verificationCode} stored for assistant ${assistantId}. Awaiting external update.`);
    }

    const userProfileUpdateResult = await userProfileCollection.updateOne(
      { _id: new ObjectId(userDbId), "assistants.id": assistantId },
      updateOperation
    );
    
    if (userProfileUpdateResult.matchedCount === 0) {
      console.log(`Assistant ${assistantId} not found for user ${userDbId}`);
      return NextResponse.json({ message: 'Assistant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Assistant status updated.' });

  } catch (error) {
    console.error('API Error (update-status):', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
