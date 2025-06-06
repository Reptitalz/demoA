
import type { DecodedIdToken } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

const FIREBASE_SERVICE_ACCOUNT_JSON_STRING = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
let firebaseAdminInitialized = false;

if (admin.apps.length === 0) { 
  if (FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
    } catch (parseError: any) {
      console.error('CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Firebase Admin SDK will not initialize.');
      console.error('Parse Error details:', parseError.message, parseError.stack); // Added stack
      console.error('Ensure the FIREBASE_SERVICE_ACCOUNT_JSON environment variable is a valid, single-line JSON string.');
    }

    if (serviceAccount) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseAdminInitialized = true;
        console.log("Firebase Admin SDK initialized successfully.");
      } catch (initError: any) {
        console.error('CRITICAL: Firebase Admin SDK initializeApp failed even after successfully parsing JSON.');
        console.error('Initialization Error details:', initError.message, initError.stack); // Added stack
        console.error('This could be due to an invalid service account structure (e.g., missing "project_id", "private_key", "client_email"), network issues, or other problems with the credentials object itself.');
      }
    }
  } else {
    console.warn(
      "Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. " +
      "Token verification will not work. API routes requiring authentication will fail."
    );
  }
} else {
  firebaseAdminInitialized = true; 
  // console.log("Firebase Admin SDK was already initialized."); // Reduce noise if already initialized
}

export async function verifyFirebaseToken(request: Request): Promise<DecodedIdToken | null> {
  if (!firebaseAdminInitialized) { // Check our explicit flag
    console.error("Firebase Admin SDK not properly initialized. Cannot verify token. Check server logs for critical initialization errors during application startup.");
    return null;
  }
  // Double check admin.apps.length just in case, though firebaseAdminInitialized should be authoritative
  if (admin.apps.length === 0) {
     console.error("Firebase Admin SDK: admin.apps.length is 0, though firebaseAdminInitialized was true. This is unexpected. Cannot verify token.");
     return null;
  }


  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];

  if (!idToken) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error.message, error.stack); // Added stack
    if (error.code === 'auth/id-token-expired') {
      console.log('Firebase ID token has expired.');
    } else if (error.code === 'auth/argument-error') {
        console.log('Firebase ID token is malformed or has been revoked.');
    }
    return null;
  }
}

export { admin as firebaseAdmin, firebaseAdminInitialized };
