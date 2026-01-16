// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

// Start Firebase
const app = initializeApp(firebaseConfig);

if (import.meta.env.DEV) {
  console.info("[Firebase] Running in development mode");
  console.debug("[Firebase] Configuration", {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId
  });
}

const FIRESTORE_DATABASE_ID = import.meta.env.VITE_FIRESTORE_DATABASE || "(default)";

// Export the Firestore database (you can target a multi-database instance by setting VITE_FIRESTORE_DATABASE)
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

// Export Firebase Authentication
export const auth = getAuth(app);

// Auth ready promise - resolves when auth state is initialized
let authReadyResolve;
export const authReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

// Initialize authentication state
let isAuthInitialized = false;
onAuthStateChanged(auth, async (user) => {
  if (!isAuthInitialized) {
    isAuthInitialized = true;
    if (import.meta.env.DEV) {
      console.info("[Firebase Auth] Initial state:", user ? "Authenticated" : "Not authenticated");
    }
    authReadyResolve(user);
  }

  // If not signed in, sign in anonymously for Firestore access
  if (!user) {
    try {
      const result = await signInAnonymously(auth);
      if (import.meta.env.DEV) {
        console.info("[Firebase Auth] Signed in anonymously:", result.user.uid);
      }
    } catch (error) {
      console.error("[Firebase Auth] Anonymous sign-in failed:", error);
    }
  }
});

// Helper function to ensure auth is ready before Firestore operations
export const ensureAuth = async () => {
  await authReady;
  if (!auth.currentUser) {
    // If still no user, try to sign in anonymously again
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("[Firebase Auth] Failed to ensure authentication:", error);
      throw new Error("Authentication required for Firestore access");
    }
  }
  return auth.currentUser;
};
