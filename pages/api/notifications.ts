// /pages/api/notifications.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/mongodb';
import { AppNotification } from '@/types';
import { ObjectId } from 'mongodb';

const NOTIFICATIONS_COLLECTION = 'notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const decodedToken = await verifyFirebaseToken(req);
    if (!decodedToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        return getNotifications(req, res, decodedToken.uid);
    } else if (req.method === 'POST') {
        return markNotificationsAsRead(req, res, decodedToken.uid);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function getNotifications(req: NextApiRequest, res: NextApiResponse, userId: string) {
    try {
        const { db } = await connectToDatabase();
        const notifications = await db
            .collection<AppNotification>(NOTIFICATIONS_COLLECTION)
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
            
        const unreadCount = await db.collection<AppNotification>(NOTIFICATIONS_COLLECTION).countDocuments({
            userId: userId,
            read: false
        });

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error('API Error (GET /api/notifications):', error);
        return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
}

async function markNotificationsAsRead(req: NextApiRequest, res: NextApiResponse, userId: string) {
    try {
        const { notificationIds } = req.body;

        if (!Array.isArray(notificationIds)) {
            return res.status(400).json({ message: 'Invalid request body, expected notificationIds array' });
        }

        if (notificationIds.length === 0) {
            return res.status(200).json({ success: true, modifiedCount: 0 });
        }

        const { db } = await connectToDatabase();
        const filter = {
            userId: userId,
            _id: { $in: notificationIds.map(id => new ObjectId(id)) }
        };
        
        const result = await db.collection<AppNotification>(NOTIFICATIONS_COLLECTION).updateMany(
            filter,
            { $set: { read: true } }
        );

        return res.status(200).json({ success: true, modifiedCount: result.modifiedCount });

    } catch (error) {
        console.error('API Error (POST /api/notifications):', error);
        return res.status(500).json({ message: 'Failed to update notifications' });
    }
}
