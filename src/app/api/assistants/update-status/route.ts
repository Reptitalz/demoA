
// src/app/api/assistants/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import { ObjectId } from 'mongodb';
import axios from 'axios';

const N8N_WEBHOOK_URL = 'https://n8n.reptitalz.cloud/webhook/codemax';

async function sendActivationWebhook(userEmail: string, assistantName: string, verificationCode: string) {
    try {
        const payload = {
            email: userEmail,
            assistantName: assistantName,
            code: verificationCode,
        };
        console.log("Sending activation webhook to n8n with payload:", payload);
        await axios.post(N8N_WEBHOOK_URL, payload, { timeout: 5000 });
        console.log("Successfully sent activation webhook to n8n.");
    } catch (error) {
        // We don't want to block the main flow if the webhook fails, but we should log it.
        console.error("Error sending activation webhook to n8n:", error instanceof Error ? error.message : error);
    }
}


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

    // First, find the user and the specific assistant to get details for the webhook
    const user = await userProfileCollection.findOne({ _id: new ObjectId(userDbId) });
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const assistant = user.assistants.find(a => a.id === assistantId);
    if (!assistant) {
        return NextResponse.json({ message: 'Assistant not found for this user' }, { status: 404 });
    }

    // Send the webhook notification
    if (user.email && assistant.name) {
       await sendActivationWebhook(user.email, assistant.name, verificationCode);
    } else {
       console.warn("Could not send activation webhook because user email or assistant name is missing.");
    }
    

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
          "assistants.$.isActive": true, // Also set the primary status flag
          "assistants.$.phoneLinked": phoneNumber, // ensure phone is set
        }
      };
      console.log(`Activating assistant ${assistantId} for user ${userDbId}`);
    } else if (verificationCode.startsWith('B')) {
      // Failure case: Reset the assistant's phone details
      updateOperation = {
        $set: {
            "assistants.$.numberReady": false, // explicitly set to false
            "assistants.$.isActive": false,
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
          "assistants.$.isActive": false,
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
