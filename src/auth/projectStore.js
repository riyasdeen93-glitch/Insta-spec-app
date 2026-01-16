import { db, ensureAuth } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { normalizeEmail } from "./betaAccess";

export async function loadProjectsForUser(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return [];

  // Ensure Firebase Auth is ready before accessing Firestore
  const user = await ensureAuth();

  // Query by UID (owner field) instead of email for better security
  const q = query(collection(db, "projects"), where("owner", "==", user.uid));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function saveProjectForUser(rawEmail, project) {
  const email = normalizeEmail(rawEmail);
  if (!email) throw new Error("Missing owner email");

  // Ensure Firebase Auth is ready before accessing Firestore
  const user = await ensureAuth();

  const now = Date.now();
  // Store with UID-based ownership and email for reference
  const payload = {
    ...project,
    owner: user.uid,           // UID for Firestore rules
    userEmail: email,          // Email for reference/display
    updatedAt: now
  };

  if (project.id) {
    const ref = doc(db, "projects", project.id);
    await setDoc(
      ref,
      {
        ...payload,
        createdAt: project.createdAt || now
      },
      { merge: true }
    );
    return { ...project, updatedAt: now };
  }

  const ref = await addDoc(collection(db, "projects"), {
    ...payload,
    createdAt: now
  });
  return { ...project, id: ref.id, createdAt: now, updatedAt: now };
}

export async function deleteProjectForUser(projectId) {
  if (!projectId) return;

  // Ensure Firebase Auth is ready before accessing Firestore
  await ensureAuth();

  const ref = doc(db, "projects", projectId);
  await deleteDoc(ref);
}
