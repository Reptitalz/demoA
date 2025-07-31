// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AppNotification } from '@/types';
import { ObjectId } from 'mongodb';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const notifications = await db
      .collection<AppNotification>(NOTIFICATIONS_COLLECTION)
      .find({ userId: userId })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(20) // Limit to last 20 notifications
      .toArray();
      
    const unreadCount = await db.collection<AppNotification>(NOTIFICATIONS_COLLECTION).countDocuments({
        userId: userId,
        read: false
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('API Error (GET /api/notifications):', error);
    return NextResponse.json({ message: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  
  try {
    const { notificationIds, userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!Array.isArray(notificationIds)) {
        return NextResponse.json({ message: 'Invalid request body, expected notificationIds array' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    if (notificationIds.length === 0) {
        return NextResponse.json({ success: true, modifiedCount: 0 });
    }

    const filter = {
        userId: userId,
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
