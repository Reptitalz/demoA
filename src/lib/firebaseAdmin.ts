
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next'; // Changed import for pages/api
import { NextRequest } from 'next/server';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountString) {
  console.warn('CRITICAL: Firebase Admin SDK environment variable (FIREBASE_SERVICE_ACCOUNT_JSON) is not set. Firebase Admin features will not work.');
}

if (!admin.apps.length && serviceAccountString) {
  try {
    const serviceAccount = JSON.parse(serviceAccountString.replace(/\\n/g, '\n'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error in firebaseAdmin.ts:', e.stack);
  }
}

/**
 * Verifies the Firebase ID token from the Authorization header of a request.
 * Works for both pages/api (NextApiRequest) and app router (NextRequest).
 * @param req The incoming request.
 * @returns A promise that resolves to the decoded token, or null if invalid.
 */
export async function verifyFirebaseToken(req: NextApiRequest | NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization || (req.headers.get ? req.headers.get('authorization') : null);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    return null;
  }

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
