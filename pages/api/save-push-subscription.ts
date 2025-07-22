// /pages/api/save-push-subscription.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

const PROFILES_COLLECTION = 'userProfiles';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const decodedToken = await verifyFirebaseToken(req);
    if (!decodedToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ message: 'Invalid subscription object' });
    }

    try {
        const { db } = await connectToDatabase();
        const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

        const result = await userProfileCollection.updateOne(
            { firebaseUid: decodedToken.uid },
            { $addToSet: { pushSubscriptions: subscription } }
        );

        if (result.modifiedCount > 0 || result.matchedCount > 0) {
            return res.status(200).json({ success: true, message: 'Subscription saved successfully.' });
        } else {
            console.error(`Failed to save push subscription: User profile not found for firebaseUid ${decodedToken.uid}`);
            return res.status(404).json({ message: 'User profile not found.' });
        }
    } catch (error) {
        console.error('API Error (save-push-subscription):', error);
        return res.status(500).json({ message: 'Failed to save subscription.' });
    }
}
