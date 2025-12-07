import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  runTransaction
} from "firebase/firestore";

const STORAGE_KEYS = {
  loginLog: "instaspec:betaLoginLog",
  feedback: "instaspec:betaFeedback",
  usage: "instaspec:betaUsage"
};

const hasWindow = typeof window !== "undefined";
const DOWNLOAD_USAGE_COLLECTION = "betaUsage";
const DEFAULT_DOWNLOAD_LIMIT = 10;

export const ADMIN_EMAILS = [
  "admin@techarix.com"
];

export const MASTER_ADMIN_CODE =
  import.meta.env.VITE_MASTER_BETA_CODE || "INSTASPECMASTER@2025";

export const normalizeEmail = (value = "") => value.trim().toLowerCase();

const randomChunk = () => Math.random().toString(36).substring(2, 6).toUpperCase();
export const generateNewBetaCode = () => `BETA-${randomChunk()}-${randomChunk()}`;

const betaUserCache = new Map();

const readJSON = (key, fallback) => {
  if (!hasWindow) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to parse localStorage key ${key}`, err);
    return fallback;
  }
};

const writeJSON = (key, value) => {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to persist localStorage key ${key}`, err);
  }
};

export async function getBetaUser(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  const ref = doc(db, "betaUsers", email);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = { ...snap.data(), email };
  betaUserCache.set(email, data);
  return data;
}

export async function listBetaUsers() {
  const snap = await getDocs(collection(db, "betaUsers"));
  const users = snap.docs.map((docSnap) => {
    const data = docSnap.data();
    const email = data.email || docSnap.id;
    const normalized = normalizeEmail(email);
    const payload = { ...data, email: normalized };
    betaUserCache.set(normalized, payload);
    return payload;
  });
  return users;
}

export async function saveBetaUser({
  email: rawEmail,
  code,
  plan = "beta_tester",
  isAdmin = false,
  hours = 1,
  expiresAt
}) {
  const email = normalizeEmail(rawEmail);
  if (!email) throw new Error("Missing email");
  const ref = doc(db, "betaUsers", email);
  const now = Date.now();
  const existingSnap = await getDoc(ref);
  const existing = existingSnap.exists() ? existingSnap.data() : null;
  const createdAt = existing?.createdAt || now;
  const expiry = typeof expiresAt === "number" ? expiresAt : now + hours * 60 * 60 * 1000;

  const payload = {
    email,
    code,
    plan,
    isAdmin,
    expiresAt: expiry,
    updatedAt: now,
    createdAt
  };

  await setDoc(ref, payload, { merge: true });
  betaUserCache.set(email, payload);
  return payload;
}

export async function deleteBetaUser(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return;
  await deleteDoc(doc(db, "betaUsers", email));
  betaUserCache.delete(email);
}

export async function validateBetaAccess(rawEmail, code) {
  if (!rawEmail || !code) return false;
  const email = normalizeEmail(rawEmail);
  const user = await getBetaUser(email);
  if (!user) return false;
  const now = Date.now();
  const codeMatches = user.code === code;
  const notExpired = !user.expiresAt || now <= user.expiresAt;
  return codeMatches && notExpired ? user : false;
}

export function isAdminEmail(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) return false;
  if (betaUserCache.has(email)) {
    return Boolean(betaUserCache.get(email)?.isAdmin);
  }
  return ADMIN_EMAILS.includes(email);
}

const MAX_LOGIN_LOGS = 50;
const RECENT_LOGIN_LIMIT = 20;
const loginLogStore = readJSON(STORAGE_KEYS.loginLog, []);

const persistLoginLog = () => writeJSON(STORAGE_KEYS.loginLog, loginLogStore);

export const getLoginStats = () => {
  const recent = loginLogStore
    .slice(-RECENT_LOGIN_LIMIT)
    .reverse()
    .map((entry) => ({ ...entry }));
  return {
    totalLogins: loginLogStore.length,
    recentLogins: recent
  };
};

export const recordSuccessfulLogin = (email, isAdmin) => {
  if (!email) return;
  const entry = {
    email: normalizeEmail(email),
    isAdmin: Boolean(isAdmin),
    timestamp: Date.now()
  };
  loginLogStore.push(entry);
  if (loginLogStore.length > MAX_LOGIN_LOGS) {
    loginLogStore.splice(0, loginLogStore.length - MAX_LOGIN_LOGS);
  }
  persistLoginLog();
};

const readFeedbackList = () => {
  const stored = readJSON(STORAGE_KEYS.feedback, []);
  if (!Array.isArray(stored)) return [];
  return stored.map((entry) => ({
    id: entry?.id || `fdbk_${Date.now()}`,
    email: normalizeEmail(entry?.email || ""),
    createdAt: typeof entry?.createdAt === "number" ? entry.createdAt : Date.now(),
    context: entry?.context || "Other",
    message: entry?.message || "",
    imageDataUrl: entry?.imageDataUrl || null
  }));
};

let feedbackCache = readFeedbackList();
const persistFeedback = () => writeJSON(STORAGE_KEYS.feedback, feedbackCache);

export const loadFeedback = () =>
  [...feedbackCache].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

export const saveFeedback = (list = []) => {
  feedbackCache = Array.isArray(list) ? list : [];
  persistFeedback();
  return loadFeedback();
};

export const addFeedback = ({ email, context, message, imageDataUrl }) => {
  const entry = {
    id: `fdbk_${Date.now()}`,
    email: normalizeEmail(email),
    createdAt: Date.now(),
    context: context || "Other",
    message: message || "",
    imageDataUrl: imageDataUrl || null
  };
  feedbackCache = [entry, ...feedbackCache];
  persistFeedback();
  return entry;
};

export async function getDownloadUsage(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { count: 0, limit: DEFAULT_DOWNLOAD_LIMIT };
  }
  const usageRef = doc(db, DOWNLOAD_USAGE_COLLECTION, email);
  const snap = await getDoc(usageRef);
  if (!snap.exists()) {
    return { count: 0, limit: DEFAULT_DOWNLOAD_LIMIT };
  }
  const data = snap.data() || {};
  return {
    count: data.count || 0,
    limit: data.limit || DEFAULT_DOWNLOAD_LIMIT
  };
}

export async function incrementDownloadCount(rawEmail, limit = DEFAULT_DOWNLOAD_LIMIT) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { allowed: false, count: 0, limit };
  }
  const usageRef = doc(db, DOWNLOAD_USAGE_COLLECTION, email);
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(usageRef);
    const currentCount = snap.exists() ? snap.data().count || 0 : 0;
    if (currentCount >= limit) {
      return { allowed: false, count: currentCount, limit };
    }
    const nextCount = currentCount + 1;
    transaction.set(
      usageRef,
      {
        email,
        count: nextCount,
        limit,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    return { allowed: true, count: nextCount, limit };
  });
}
