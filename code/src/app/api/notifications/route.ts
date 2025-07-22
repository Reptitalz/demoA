// src/app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AppNotification } from '@/types';
import { ObjectId } from 'mongodb';
import * as admin from 'firebase-admin';

// --- Firebase Admin Initialization (Server-Side Only) ---
const FIREBASE_SERVICE_ACCOUNT_JSON_STRING = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (admin.apps.length === 0 && FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON_STRING.replace(/\\n/g, '\n'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK for notifications route initialized.");
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error in notifications route:', e.stack);
  }
}
// --- End Firebase Admin Initialization ---

async function verifyFirebaseToken(request: NextRequest): Promise<admin.auth.DecodedIdToken | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) return null;

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying Firebase ID token in notifications route:', error);
    return null;
  }
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function GET(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const notifications = await db
      .collection<AppNotification>(NOTIFICATIONS_COLLECTION)
      .find({ userId: decodedToken.uid })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(20) // Limit to last 20 notifications
      .toArray();
      
    const unreadCount = await db.collection<AppNotification>(NOTIFICATIONS_COLLECTION).countDocuments({
        userId: decodedToken.uid,
        read: false
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('API Error (GET /api/notifications):', error);
    return NextResponse.json({ message: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds)) {
        return NextResponse.json({ message: 'Invalid request body, expected notificationIds array' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    if (notificationIds.length === 0) {
        return NextResponse.json({ success: true, modifiedCount: 0 });
    }

    const filter = {
        userId: decodedToken.uid,
        _id: { $in: notificationIds.map(id => new ObjectId(id)) }
    };
    
    const result = await db.collection<AppNotification>(NOTIFICATIONS_COLLECTION).updateMany(
      filter,
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });

  } catch (error) {
    console.error('API Error (POST /api/notifications):', error);
    return NextResponse.json({ message: 'Failed to update notifications' }, { status: 500 });
  }
}
