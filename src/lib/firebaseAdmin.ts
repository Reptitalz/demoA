
// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next';
import { NextRequest } from 'next/server';

// This is a more robust way to initialize, directly from individual env vars.
// It avoids JSON parsing errors.
const serviceAccount = {
  projectId: process.env.FB_PROJECT_ID,
  // CRITICAL FIX: The private key from env vars can have extra quotes and escaped newlines.
  // 1. .replace(/"/g, '') removes any surrounding quotes.
  // 2. .replace(/\\n/g, '\n') ensures newlines are correctly formatted.
  privateKey: process.env.FB_PRIVATE_KEY?.replace(/"/g, '').replace(/\\n/g, '\n'),
  clientEmail: process.env.FB_CLIENT_EMAIL,
};

const areCredsAvailable = serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail;

if (!admin.apps.length) {
  if (areCredsAvailable) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error('Firebase Admin SDK Initialization Error:', e.stack);
    }
  } else if (process.env.NODE_ENV !== 'test') {
    // Only show warning if not in a test environment
    console.warn('CRITICAL: Firebase Admin SDK environment variables (FB_PROJECT_ID, FB_PRIVATE_KEY, FB_CLIENT_EMAIL) are not set. Firebase Admin features will not be available.');
  }
}


/**
 * Verifies the Firebase ID token from the Authorization header.
 * Supports both NextApiRequest (pages/api) and NextRequest (middleware/app).
 */
export async function verifyFirebaseToken(
  req: NextApiRequest | NextRequest
): Promise<DecodedIdToken | null> {
  let authHeader: string | null = null;

  if ('headers' in req) {
    if (typeof req.headers.get === 'function') {
      // Es NextRequest
      authHeader = req.headers.get('authorization');
    } else {
      // Es NextApiRequest
      authHeader = (req.headers as any).authorization || null;
    }
  }

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
