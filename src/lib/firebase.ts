
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  type User, 
  signInWithRedirect, 
  getRedirectResult, 
  type Auth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null;
let auth: Auth;
let googleProvider: GoogleAuthProvider | null;

// Check if essential Firebase config is present
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    console.warn("**********************************************************************************");
    console.warn("WARNING: Firebase client configuration is missing (NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN).");
    console.warn("Firebase authentication will be disabled. App will run in a limited mode.");
    console.warn("Please add your Firebase project's web app configuration to your .env.local file to enable full functionality.");
    console.warn("**********************************************************************************");

    // Create a mock auth object to prevent the app from crashing.
    // This allows the app to load even without Firebase credentials.
    app = null;
    auth = {
      onAuthStateChanged: () => {
        // This is a mock function. It returns an empty unsubscribe function.
        return () => {};
      },
      // Mock other functions used in the app to prevent crashes
      signInWithPopup: () => Promise.reject(new Error("Firebase is not configured. Please add credentials to .env.local.")),
      signOut: () => Promise.resolve(),
      currentUser: null,
    } as unknown as Auth;
    googleProvider = null;
} else {
    // Initialize Firebase normally
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
}


export { auth, googleProvider, signInWithPopup, signOut, signInWithRedirect, getRedirectResult };
export type { User as FirebaseUser };
