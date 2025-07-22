import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

// This prevents multiple initializations in a serverless environment
if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountString) {
    throw new Error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error:', e.stack);
    throw new Error('Failed to initialize Firebase Admin SDK. Check service account credentials.');
  }
}

/**
 * Verifies the Firebase ID token from the Authorization header of a request.
 * @param request The incoming NextRequest.
 * @returns A promise that resolves to the decoded token, or null if invalid.
 */
export async function verifyFirebaseToken(request: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}

export const firebaseAdmin = admin;
