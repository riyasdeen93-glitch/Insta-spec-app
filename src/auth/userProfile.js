import { db, auth, ensureAuth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { normalizeEmail } from "./betaAccess";

/**
 * Creates or updates a user profile that links Firebase Auth UID to beta email
 * This allows Firestore rules to check ownership by UID instead of email
 */
export async function createOrUpdateUserProfile(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Invalid email");

  // Ensure auth is ready
  const user = await ensureAuth();
  if (!user) throw new Error("Not authenticated");

  const profileRef = doc(db, "userProfiles", user.uid);

  try {
    await setDoc(
      profileRef,
      {
        uid: user.uid,
        email: normalizedEmail,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    return { uid: user.uid, email: normalizedEmail };
  } catch (error) {
    console.error("[UserProfile] Failed to create/update profile:", error);
    throw error;
  }
}

/**
 * Gets the user profile for the current authenticated user
 */
export async function getUserProfile() {
  const user = await ensureAuth();
  if (!user) return null;

  const profileRef = doc(db, "userProfiles", user.uid);

  try {
    const snap = await getDoc(profileRef);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (error) {
    console.error("[UserProfile] Failed to get profile:", error);
    return null;
  }
}

/**
 * Gets the current user's UID
 */
export function getCurrentUserUID() {
  return auth.currentUser?.uid || null;
}
