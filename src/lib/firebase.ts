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
};

let app: FirebaseApp;

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    console.warn("**********************************************************************************");
    console.warn("WARNING: Firebase client configuration is missing or incomplete.");
    console.warn("**********************************************************************************");
    // Create a dummy app object to avoid crashing the app if firebase is not configured
    app = {} as FirebaseApp;
} else {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
}

const auth = getAuth(app);

export { app, auth, signOut };
