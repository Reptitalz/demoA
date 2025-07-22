import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserProfile } from '@/types';
import * as admin from 'firebase-admin';

// --- Firebase Admin Initialization (Server-Side Only) ---
const FIREBASE_SERVICE_ACCOUNT_JSON_STRING = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (admin.apps.length === 0 && FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON_STRING.replace(/\\n/g, '\n'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK for save-push-subscription route initialized.");
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error in save-push-subscription route:', e.stack);
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
    console.error('Error verifying Firebase ID token in save-push-subscription route:', error);
    return null;
  }
}

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
