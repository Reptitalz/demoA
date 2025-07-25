// src/lib/firebaseAdmin.ts
import 'dotenv/config'; // Make sure environment variables are loaded
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

if (!admin.apps.length) {
  try {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    if (!serviceAccount.privateKey || !serviceAccount.clientEmail || !serviceAccount.projectId) {
         console.error('Firebase Admin SDK Initialization Error: Missing required environment variables (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, NEXT_PUBLIC_FIREBASE_PROJECT_ID).');
    } else {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    }

  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error:', e.stack);
  }
}

/**
 * Verifies the Firebase ID token from the Authorization header of a NextRequest.
 * @param request The NextRequest object.
 * @returns A promise that resolves to the decoded token if valid, or null otherwise.
 */
export async function verifyFirebaseToken(request: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No Firebase ID token was passed as a Bearer token in the Authorization header.');
    return null;
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    console.log('ID token is missing after "Bearer " prefix.');
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
