
import type { DecodedIdToken } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

const FIREBASE_SERVICE_ACCOUNT_JSON_STRING = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (admin.apps.length === 0) { // Check if already initialized
  if (FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
    try {
      const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON or initializing Firebase Admin SDK:", error.message);
      console.error("Make sure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string and is correctly set in your environment variables.");
      // admin.apps.length will remain 0, handled by verifyFirebaseToken
    }
  } else {
    console.warn(
      "Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. " +
      "Token verification will not work. API routes requiring authentication will fail."
    );
  }
}

export async function verifyFirebaseToken(request: Request): Promise<DecodedIdToken | null> {
  if (admin.apps.length === 0) {
    console.error("Firebase Admin SDK not initialized. Cannot verify token. Check server logs for initialization errors.");
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // This case is handled by the API route returning 401, but good to be aware.
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
    console.error('Error verifying Firebase ID token:', error.message);
    return null;
  }
}

export { admin as firebaseAdmin };
