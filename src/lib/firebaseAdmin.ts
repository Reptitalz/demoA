import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

// This prevents multiple initializations in a serverless environment
if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountString) {
    console.error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
    // We don't throw here to allow the app to build, but dependent APIs will fail.
  } else {
    try {
      // The key part: Replace escaped newlines with actual newlines before parsing.
      // This is crucial for environments that don't handle multiline env variables well.
      const serviceAccount = JSON.parse(serviceAccountString.replace(/\\n/g, '\n'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e: any) {
      console.error('Firebase Admin SDK Initialization Error in firebaseAdmin.ts:', e.stack);
      // Log the specific error but don't throw to allow the build to complete.
      // Functions relying on this will fail gracefully.
    }
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

  // Ensure admin is initialized before trying to use it
  if (!admin.apps.length) {
    console.error("Firebase Admin SDK not initialized. Cannot verify token.");
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
