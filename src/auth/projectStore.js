import { db } from "../firebase";
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
  const q = query(collection(db, "projects"), where("ownerEmail", "==", email));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function saveProjectForUser(rawEmail, project) {
  const email = normalizeEmail(rawEmail);
  if (!email) throw new Error("Missing owner email");
  const now = Date.now();
  const payload = { ...project, ownerEmail: email, updatedAt: now };

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
  const ref = doc(db, "projects", projectId);
  await deleteDoc(ref);
}
