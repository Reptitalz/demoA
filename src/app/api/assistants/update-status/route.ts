// src/app/api/assistants/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { sendPushNotification } from '@/services/pushService';
import type { UserProfile, AppNotification } from '@/types';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';

// This map simulates different outcomes of an asynchronous process.
const SIMULATION_OUTCOMES = [
  { status: true, message: "ha sido activado y está listo para usarse.", type: 'success' as const },
  { status: false, message: "no pudo ser activado. El número no es válido para WhatsApp.", type: 'error' as const },
  { status: true, message: "ha sido activado y está listo para usarse.", type: 'success' as const }, // Higher chance of success
  { status: false, message: "fue rechazado. Por favor, reenvía el código de verificación.", type: 'warning' as const },
] as const;

export async function POST(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { assistantId, phoneNumber, verificationCode } = await request.json();
  if (!assistantId || !phoneNumber || !verificationCode) {
    return NextResponse.json({ message: 'assistantId, phoneNumber, and verificationCode are required' }, { status: 400 });
  }

  // Simulate a delay for the backend process (e.g., 5-10 seconds)
  await new Promise(resolve => setTimeout(resolve, 7000));
  
  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>('userProfiles');
    const notificationsCollection = db.collection<AppNotification>('notifications');
    
    // Pick a random outcome for the simulation
    const outcome = SIMULATION_OUTCOMES[Math.floor(Math.random() * SIMULATION_OUTCOMES.length)];

    // Update the assistant's status in the user's profile
    const userProfileUpdateResult = await userProfileCollection.updateOne(
      { firebaseUid: decodedToken.uid, "assistants.id": assistantId },
      { 
        $set: { "assistants.$.numberReady": outcome.status },
        // If the activation fails, clear the verification code to allow retries
        ...(!outcome.status && { $unset: { "assistants.$.verificationCode": "" } })
      }
    );
    
    if (userProfileUpdateResult.matchedCount === 0) {
      console.log(`Assistant ${assistantId} not found for user ${decodedToken.uid}`);
      return NextResponse.json({ message: 'Assistant not found' }, { status: 404 });
    }

    const userProfile = await userProfileCollection.findOne({ firebaseUid: decodedToken.uid });
    const assistant = userProfile?.assistants.find(a => a.id === assistantId);

    if (!assistant) {
         return NextResponse.json({ message: 'Assistant not found after update' }, { status: 404 });
    }

    const notificationMessage = `Tu asistente "${assistant.name}" ${outcome.message}`;

    // Create a notification document in the database
    const newNotification: Omit<AppNotification, '_id'> = {
      userId: decodedToken.uid,
      message: notificationMessage,
      type: outcome.type,
      read: false,
      link: '/dashboard',
      createdAt: new Date(),
    };
    await notificationsCollection.insertOne(newNotification as AppNotification);

    // Send a push notification to the user
    await sendPushNotification(decodedToken.uid, {
      title: 'Actualización de Asistente',
      body: notificationMessage,
      url: '/dashboard',
      tag: 'profile-update', // This tag will trigger a profile refresh on the client
    });

    return NextResponse.json({ success: true, message: 'Assistant status updated and notification sent.' });

  } catch (error) {
    console.error('API Error (update-status):', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
