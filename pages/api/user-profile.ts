// /pages/api/user-profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { UserProfile } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';

const PROFILES_COLLECTION = 'userProfiles';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return getProfile(req, res);
    } else if (req.method === 'POST') {
        return saveProfile(req, res);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function getProfile(req: NextApiRequest, res: NextApiResponse) {
    const decodedToken = await verifyFirebaseToken(req);
    if (!decodedToken) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
    }

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'User ID is required in query parameters' });
    }

    if (decodedToken.uid !== userId) {
        return res.status(403).json({ message: 'Forbidden: Token UID does not match requested User ID' });
    }

    try {
        const { db } = await connectToDatabase();
        const profile = await db.collection<UserProfile>(PROFILES_COLLECTION).findOne({ firebaseUid: userId });

        if (profile) {
            const profileSafe: UserProfile = {
                firebaseUid: profile.firebaseUid,
                email: profile.email,
                isAuthenticated: true,
                assistants: (profile.assistants || []).map(asst => ({
                    ...asst,
                    purposes: Array.isArray(asst.purposes) ? asst.purposes : [],
                    imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
                    businessInfo: asst.businessInfo || {},
                })),
                databases: profile.databases || [],
                ownerPhoneNumberForNotifications: profile.ownerPhoneNumberForNotifications,
                credits: profile.credits || 0,
                pushSubscriptions: profile.pushSubscriptions || [],
            };
            return res.status(200).json({ userProfile: profileSafe, message: "User profile fetched successfully" });
        } else {
            return res.status(404).json({ userProfile: null, message: "User profile not found" });
        }
    } catch (error) {
        console.error("API GET Error (Database Operation or Data Processing):", error);
        return res.status(500).json({ message: 'Failed to fetch user profile due to an internal error' });
    }
}

async function saveProfile(req: NextApiRequest, res: NextApiResponse) {
    const decodedToken = await verifyFirebaseToken(req);
    if (!decodedToken) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or missing token' });
    }

    try {
        const { userId: bodyUserId, userProfile } = req.body;

        if (!bodyUserId || !userProfile) {
            return res.status(400).json({ message: 'User ID and userProfile are required in the body' });
        }

        if (decodedToken.uid !== bodyUserId) {
            return res.status(403).json({ message: 'Forbidden: Token UID does not match User ID in request body' });
        }
        
        const { db } = await connectToDatabase();

        const serializableProfile = {
            firebaseUid: decodedToken.uid,
            email: userProfile.email,
            isAuthenticated: userProfile.isAuthenticated,
            ownerPhoneNumberForNotifications: userProfile.ownerPhoneNumberForNotifications,
            credits: userProfile.credits || 0,
            assistants: (userProfile.assistants || []).map((asst: any) => ({
                ...asst,
                purposes: Array.isArray(asst.purposes) ? asst.purposes : Array.from(asst.purposes || []),
                imageUrl: asst.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL,
                businessInfo: asst.businessInfo || {},
            })),
            databases: userProfile.databases || [],
            pushSubscriptions: userProfile.pushSubscriptions || [],
        };
        
        const result = await db.collection<UserProfile>(PROFILES_COLLECTION).updateOne(
            { firebaseUid: decodedToken.uid },
            { $set: serializableProfile },
            { upsert: true }
        );

        let responseMessage = "";
        if (result.upsertedId) {
            responseMessage = "User profile created successfully.";
        } else if (result.modifiedCount > 0) {
            responseMessage = "User profile updated successfully.";
        } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
            responseMessage = "User profile already up to date.";
        } else {
            console.error("API POST: No document matched, and no document was upserted despite upsert:true.", result);
            return res.status(500).json({ message: "Failed to save user profile: No document matched or upserted" });
        }

        return res.status(200).json({ message: responseMessage, userId: decodedToken.uid, ...(result.upsertedId && {upsertedId: result.upsertedId}) });

    } catch (requestError) {
        console.error("API POST (Request Processing) Error:", requestError);
        return res.status(500).json({ message: 'Failed to process request due to an internal error' });
    }
}
