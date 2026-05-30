// Firebase initialisation — Auth + Firestore
// All config values come from VITE_ env vars so they are
// baked into the client bundle at build time (safe for Firebase public config).

import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Guard: if any required key is missing, Firebase will fail loudly in console
// but the app falls back to localStorage-only mode gracefully.
const isConfigured = Object.values(firebaseConfig).every(Boolean);

const app      = isConfigured ? initializeApp(firebaseConfig) : null;
const auth     = app ? getAuth(app) : null;
const db       = app ? getFirestore(app) : null;
const analytics = app ? getAnalytics(app) : null;

// Thin wrapper — safe to call even when analytics is null
export function track(eventName, params = {}) {
  if (analytics) logEvent(analytics, eventName, params);
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

const googleProvider = app ? new GoogleAuthProvider() : null;

export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase not configured");
  try {
    // Popup works on web; Capacitor needs redirect — handled in Phase 2
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    // Popup blocked (e.g. mobile WebView) — fall back to redirect
    if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, googleProvider);
      return null; // page will reload; getRedirectResult handles the rest
    }
    throw err;
  }
}

export async function handleRedirectResult() {
  if (!auth) return null;
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export function subscribeToAuthState(callback) {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

/**
 * Write (merge) a plain object into a user-scoped Firestore document.
 * Path: users/{uid}/{collection}
 * Falls back silently if Firebase is not configured or user is not signed in.
 */
export async function firestoreSet(uid, collection, data) {
  if (!db || !uid) return;
  try {
    await setDoc(
      doc(db, "users", uid, collection, "data"),
      { ...data, _updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.warn("[Firestore] write failed:", err.message);
  }
}

/**
 * Read a user-scoped Firestore document.
 * Returns the plain data object, or null if missing / offline.
 */
export async function firestoreGet(uid, collection) {
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid, collection, "data"));
    if (!snap.exists()) return null;
    const { _updatedAt, ...rest } = snap.data();
    return rest;
  } catch (err) {
    console.warn("[Firestore] read failed:", err.message);
    return null;
  }
}

export { auth, db, isConfigured };
