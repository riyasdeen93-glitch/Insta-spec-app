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

// Auth ready promise - resolves when auth state is initialized AND user is authenticated
let authReadyResolve;
let authReadyReject;
export const authReady = new Promise((resolve, reject) => {
  authReadyResolve = resolve;
  authReadyReject = reject;
});

// Track if we're currently signing in to prevent multiple attempts
let isSigningIn = false;

// Initialize authentication state
let isAuthInitialized = false;
onAuthStateChanged(auth, async (user) => {
  if (import.meta.env.DEV) {
    console.log("[Firebase Auth] Auth state changed:", user ? `Authenticated (${user.uid})` : "Not authenticated");
  }

  if (!isAuthInitialized) {
    isAuthInitialized = true;

    // If no user on initial load, sign in anonymously and wait for completion
    if (!user && !isSigningIn) {
      isSigningIn = true;
      if (import.meta.env.DEV) {
        console.log("[Firebase Auth] No user on initial load, signing in anonymously...");
      }

      try {
        const result = await signInAnonymously(auth);
        if (import.meta.env.DEV) {
          console.log("[Firebase Auth] Anonymous sign-in successful:", result.user.uid);
        }
        // Resolve the promise with the authenticated user
        authReadyResolve(result.user);
        isSigningIn = false;
      } catch (error) {
        console.error("[Firebase Auth] Anonymous sign-in failed:", error);
        authReadyReject(error);
        isSigningIn = false;
      }
    } else if (user) {
      // User already authenticated, resolve immediately
      if (import.meta.env.DEV) {
        console.log("[Firebase Auth] User already authenticated:", user.uid);
      }
      authReadyResolve(user);
    }
  }
});

// Helper function to ensure auth is ready before Firestore operations
export const ensureAuth = async () => {
  if (import.meta.env.DEV) {
    console.log("[ensureAuth] Checking authentication state...");
  }

  // If already authenticated, return immediately
  if (auth.currentUser) {
    if (import.meta.env.DEV) {
      console.log("[ensureAuth] Already authenticated:", auth.currentUser.uid);
    }
    return auth.currentUser;
  }

  if (import.meta.env.DEV) {
    console.log("[ensureAuth] Waiting for auth initialization...");
  }

  // Wait for the initial auth state to resolve
  try {
    await authReady;
  } catch (error) {
    console.error("[ensureAuth] Auth initialization failed:", error);
    throw new Error("Authentication initialization failed");
  }

  // Double-check that we have a user
  if (!auth.currentUser) {
    if (import.meta.env.DEV) {
      console.log("[ensureAuth] No user after authReady, attempting to sign in anonymously...");
    }

    // If still no user, sign in anonymously and wait for completion
    if (isSigningIn) {
      // Another sign-in is in progress, wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return ensureAuth(); // Recursive retry
    }

    isSigningIn = true;
    try {
      const userCredential = await signInAnonymously(auth);
      if (import.meta.env.DEV) {
        console.log("[ensureAuth] Anonymous sign-in successful:", userCredential.user.uid);
      }
      isSigningIn = false;
      return userCredential.user;
    } catch (error) {
      isSigningIn = false;
      console.error("[ensureAuth] Failed to sign in anonymously:", error);
      throw new Error("Authentication required for Firestore access");
    }
  }

  if (import.meta.env.DEV) {
    console.log("[ensureAuth] Auth ready, user:", auth.currentUser.uid);
  }

  return auth.currentUser;
};
