// /pages/api/assistants/update-status.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/mongodb';
import { sendPushNotification } from '@/services/pushService';
import type { UserProfile, AppNotification } from '@/types';

// This map simulates different outcomes of an asynchronous process.
const SIMULATION_OUTCOMES = [
  { status: true, message: "ha sido activado y está listo para usarse.", type: 'success' as const },
  { status: false, message: "no pudo ser activado. El número no es válido para WhatsApp.", type: 'error' as const },
  { status: true, message: "ha sido activado y está listo para usarse.", type: 'success' as const }, // Higher chance of success
  { status: false, message: "fue rechazado. Por favor, reenvía el código de verificación.", type: 'warning' as const },
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const decodedToken = await verifyFirebaseToken(req);
    if (!decodedToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { assistantId, phoneNumber, verificationCode } = req.body;
    if (!assistantId || !phoneNumber || !verificationCode) {
        return res.status(400).json({ message: 'assistantId, phoneNumber, and verificationCode are required' });
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
            return res.status(404).json({ message: 'Assistant not found' });
        }

        const userProfile = await userProfileCollection.findOne({ firebaseUid: decodedToken.uid });
        const assistant = userProfile?.assistants.find(a => a.id === assistantId);

        if (!assistant) {
            return res.status(404).json({ message: 'Assistant not found after update' });
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

        return res.status(200).json({ success: true, message: 'Assistant status updated and notification sent.' });

    } catch (error) {
        console.error('API Error (update-status):', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
