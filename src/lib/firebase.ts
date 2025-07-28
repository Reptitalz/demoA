
// This file initializes the Firebase client app and exports auth-related utilities.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;

/**
 * Initializes and returns the Firebase app instance.
 * Ensures the app is initialized only once.
 * Returns null if the configuration is incomplete.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (app) {
    return app;
  }
  
  const allConfigKeysPresent = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseConfig.measurementId;

  if (allConfigKeysPresent) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    return app;
  } else {
    console.warn("**********************************************************************************");
    console.warn("WARNING: Firebase client configuration is missing or incomplete. Firebase features will be disabled.");
    console.warn("**********************************************************************************");
    return null;
  }
}
