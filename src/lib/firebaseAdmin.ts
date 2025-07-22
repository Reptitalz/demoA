// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

// This prevents multiple initializations in a serverless environment
if (!admin.apps.length) {
  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString.replace(/\\n/g, '\n'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e: any) {
      console.error('Firebase Admin SDK Initialization Error in firebaseAdmin.ts:', e.stack);
    }
  } else {
    console.warn('CRITICAL: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Firebase Admin features will not work.');
  }
}

/**
 * Verifies the Firebase ID token from the Authorization header of a request.
 * @param req The incoming NextApiRequest.
 * @returns A promise that resolves to the decoded token, or null if invalid.
 */
export async function verifyFirebaseToken(req: NextApiRequest): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    return null;
  }

  // Ensure the app is initialized before trying to verify a token
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
