// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next';
import { NextRequest } from 'next/server';

// This file is simplified to use the default credential provider,
// which is the most robust way to initialize in most hosting environments.
// It relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable
// or other default mechanisms provided by the hosting environment.

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // This will automatically find the credentials from the environment.
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin SDK initialized successfully using application default credentials.');
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error:', e.stack);
    // This warning helps diagnose environment configuration issues.
    if (process.env.NODE_ENV !== 'test') {
        console.warn('HINT: Make sure your hosting environment has GOOGLE_APPLICATION_CREDENTIALS set up correctly.');
    }
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
