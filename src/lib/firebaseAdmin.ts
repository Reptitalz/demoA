// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next';
import { NextRequest } from 'next/server';

// Inicialización del SDK
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
  try {
    if (serviceAccountString) {
      const serviceAccount = JSON.parse(serviceAccountString.replace(/\\n/g, '\n'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully (via JSON string).');
    } else {
      const serviceAccount = {
        projectId: process.env.FB_PROJECT_ID,
        privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FB_CLIENT_EMAIL,
      };

      const areCredsAvailable = serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail;

      if (!areCredsAvailable && process.env.NODE_ENV !== 'test') {
        console.warn('CRITICAL: Firebase Admin SDK environment variables (FB_PROJECT_ID, FB_PRIVATE_KEY, FB_CLIENT_EMAIL) are not set.');
      }

      if (areCredsAvailable) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully (via separate env vars).');
      }
    }
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error:', e.stack);
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
