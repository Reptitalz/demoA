// src/lib/firebaseAdmin.ts
// This file is kept for potential future use with services like Push Notifications,
// but it's no longer used for token verification in the authentication flow.
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // This will automatically find the credentials from the environment.
    // Recommended for most hosting environments like Vercel or Google Cloud.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin SDK initialized successfully using application default credentials.');
  } catch (e: any) {
    console.error('Firebase Admin SDK Initialization Error:', e.stack);
    // This warning helps diagnose environment configuration issues.
    if (process.env.NODE_ENV !== 'test') {
        console.warn('HINT: Make sure your hosting environment has GOOGLE_APPLICATION_CREDENTIALS set up correctly or the necessary Firebase config env vars.');
    }
  }
}

export const firebaseAdmin = admin;
