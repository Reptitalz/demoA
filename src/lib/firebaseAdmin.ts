
import type { DecodedIdToken } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

const FIREBASE_SERVICE_ACCOUNT_JSON_STRING = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
  console.warn(
    "Firebase Admin SDK: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. " +
    "Token verification will not work. Please set this variable with your service account key JSON content."
  );
}

if (admin.apps.length === 0 && FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    console.error("Make sure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string.");
  }
}

export async function verifyFirebaseToken(request: Request): Promise<DecodedIdToken | null> {
  if (!FIREBASE_SERVICE_ACCOUNT_JSON_STRING || admin.apps.length === 0) {
    console.error("Firebase Admin SDK not initialized. Cannot verify token.");
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
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}

export { admin as firebaseAdmin };
