// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

// This is the new, more robust way of initializing, which avoids JSON parsing errors.
// It requires you to set separate environment variables.
const serviceAccount = {
  projectId: process.env.FB_PROJECT_ID,
  privateKey: process.env.FB_PRIVATE_KEY, // Note: The value should include the `\n` characters for newlines
  clientEmail: process.env.FB_CLIENT_EMAIL,
};

// Check if the essential environment variables are set.
const areCredsAvailable = serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail;

if (!areCredsAvailable) {
  console.warn('CRITICAL: Firebase Admin SDK environment variables (FB_PROJECT_ID, FB_PRIVATE_KEY, FB_CLIENT_EMAIL) are not set. Firebase Admin features will not work.');
}

// This prevents multiple initializations in a serverless environment
if (!admin.apps.length && areCredsAvailable) {
  try {
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
 * @param req The incoming NextApiRequest or NextRequest.
 * @returns A promise that resolves to the decoded token, or null if invalid.
 */
export async function verifyFirebaseToken(req: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.get('authorization');
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
