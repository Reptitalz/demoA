// This file initializes the Firebase client app and exports auth-related utilities.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;

// Comprehensive check for all required Firebase config keys.
const allConfigKeysPresent = 
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId &&
  firebaseConfig.measurementId;


// Only initialize the app if the config is fully provided.
// This prevents errors during server-side rendering or build steps where env vars might not be available.
if (allConfigKeysPresent) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} else {
   console.warn("**********************************************************************************");
   console.warn("WARNING: Firebase client configuration is missing or incomplete. At least one of the required NEXT_PUBLIC_FIREBASE_... environment variables is not set. Firebase client features will be disabled.");
   console.warn("**********************************************************************************");
   // Create a dummy app object to avoid crashing the app if firebase is not configured
   app = {} as FirebaseApp;
}

// Export auth utilities separately, auth instance will be created in the provider.
export { app, getAuth, signOut, firebaseConfig };
