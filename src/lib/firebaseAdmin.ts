// src/lib/firebaseAdmin.ts
import 'dotenv/config'; // Make sure environment variables are loaded
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This "lazy" initialization ensures that environment variables are loaded
 * before the SDK is configured, preventing startup errors.
 */
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
        privateKey: (process.env.FB_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FB_CLIENT_EMAIL,
      };
      
      if (!serviceAccount.privateKey || !serviceAccount.clientEmail || !serviceAccount.projectId) {
           console.error('Firebase Admin SDK Initialization Error: Missing required environment variables (FB_PRIVATE_KEY, FB_CLIENT_EMAIL, NEXT_PUBLIC_FB_PROJECT_ID).');
           // Throw an error to prevent the app from continuing with a broken config.
           throw new Error("Firebase Admin SDK credentials are not configured.");
      } else {
          admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
          });
          console.log('Firebase Admin SDK initialized successfully.');
      }

    } catch (e: any) {
      console.error('Firebase Admin SDK Initialization Error:', e.stack);
      // Re-throw the error to make it clear that initialization failed.
      throw new Error(`Firebase Admin SDK failed to initialize: ${e.message}`);
    }
  }
  return admin;
}


/**
 * Verifies the Firebase ID token from the Authorization header of a NextRequest.
 * @param request The NextRequest object.
 * @returns A promise that resolves to the decoded token if valid, or null otherwise.
 */
export async function verifyFirebaseToken(request: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    console.log('ID token is missing after "Bearer " prefix.');
    return null;
  }

  try {
    // Ensure the admin app is initialized before trying to use it.
    const adminAuth = getFirebaseAdmin().auth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
