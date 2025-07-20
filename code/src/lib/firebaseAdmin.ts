
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
      console.error('Parse Error details:', parseError.message);
      console.error('Ensure the FIREBASE_SERVICE_ACCOUNT_JSON environment variable is a valid, single-line JSON string with correctly escaped characters.');
    }

    if (serviceAccount) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseAdminInitialized = true;
        console.log("Firebase Admin SDK initialized successfully.");
      } catch (initError: any) {
        console.error('CRITICAL: Firebase Admin SDK initializeApp failed.');
        console.error('Initialization Error details:', initError.message);
        console.error('This could be due to an invalid service account structure (e.g., malformed private_key) or other credential issues.');
      }
    }
  } else {
    // Only log a warning, don't set initialized to true
    console.warn("Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Token verification will not work.");
  }
} else {
    firebaseAdminInitialized = true;
}

export async function verifyFirebaseToken(request: Request): Promise<DecodedIdToken | null> {
  if (!firebaseAdminInitialized) {
    console.error("Attempted to verify token, but Firebase Admin SDK is not initialized. Check server startup logs.");
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
    console.error('Error verifying Firebase ID token:', error.code, error.message);
    // Log specific, common errors for better debugging
    if (error.code === 'auth/id-token-expired') {
      console.log('Firebase ID token has expired. Client should refresh.');
    } else if (error.code === 'auth/argument-error') {
        console.log('Firebase ID token is malformed or has been revoked.');
    }
    return null;
  }
}

export { admin as firebaseAdmin, firebaseAdminInitialized };
