import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { normalizeEmail } from "./betaAccess";

const FEEDBACK_COLLECTION = "feedback";

/**
 * Submit a feedback entry to Firestore.
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} params.context - Context/location
 * @param {string} params.message - Feedback message
 * @param {string|null} params.imageDataUrl - Optional base64 screenshot
 * @returns {Promise<{id: string, email: string, context: string, message: string, imageDataUrl: string|null, createdAt: number}>}
 */
export async function submitFeedback({
  email,
  context,
  message,
  imageDataUrl = null
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Feedback must include an email.");
  }
  if (!message || !message.trim()) {
    throw new Error("Feedback must include a message.");
  }

  const payload = {
    email: normalizedEmail,
    context: context || "Other",
    message: message.trim(),
    imageDataUrl: imageDataUrl || null,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), payload);
  return { id: docRef.id, ...payload };
}
