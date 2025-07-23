// This file is no longer the primary auth method but is kept in case
// any other Firebase services (like Firestore, Storage) are used directly on the client.
// For now, its auth capabilities are being replaced.

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null;

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    console.warn("**********************************************************************************");
    console.warn("WARNING: Firebase client configuration is missing or incomplete.");
    console.warn("**********************************************************************************");
    app = null;
} else {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
}

// Exporting the app instance in case other Firebase services need it.
export { app };
