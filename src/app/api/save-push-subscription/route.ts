
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';

const PROFILES_COLLECTION = 'userProfiles';

export async function POST(request: NextRequest) {
  const decodedToken = await verifyFirebaseToken(request);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await request.json();
  if (!subscription || !subscription.endpoint) {
    return NextResponse.json({ message: 'Invalid subscription object' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const userProfileCollection = db.collection<UserProfile>(PROFILES_COLLECTION);

    // Use $addToSet to avoid duplicate subscriptions for the same endpoint
    const result = await userProfileCollection.updateOne(
      { firebaseUid: decodedToken.uid },
      { $addToSet: { pushSubscriptions: subscription } }
    );

    if (result.modifiedCount > 0 || result.matchedCount > 0) {
      return NextResponse.json({ success: true, message: 'Subscription saved successfully.' });
    } else {
      // This case means the user profile was not found, which is an issue.
      console.error(`Failed to save push subscription: User profile not found for firebaseUid ${decodedToken.uid}`);
      return NextResponse.json({ message: 'User profile not found.' }, { status: 404 });
    }
  } catch (error) {
    console.error('API Error (save-push-subscription):', error);
    return NextResponse.json({ message: 'Failed to save subscription.' }, { status: 500 });
  }
}
