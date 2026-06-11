// Firebase initialisation — Auth + Firestore
// All config values come from VITE_ env vars so they are
// baked into the client bundle at build time (safe for Firebase public config).

import { Capacitor } from "@capacitor/core";
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  signInWithCredential
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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

const app       = isConfigured ? initializeApp(firebaseConfig) : null;
const auth      = app ? getAuth(app) : null;
const analytics = app ? getAnalytics(app) : null;

// ── Firestore with offline persistence ───────────────────────────────────────
// initializeFirestore must be called once before any getFirestore() usage.
// Persistent cache survives app restarts; single-tab manager is lighter-weight
// for mobile (Capacitor), multi-tab is used on web where multiple tabs are common.
function createDb(firebaseApp) {
  try {
    const tabManager = Capacitor.isNativePlatform()
      ? persistentSingleTabManager({})
      : persistentMultipleTabManager();
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager })
    });
  } catch (err) {
    console.warn("[Firestore] Persistent cache init failed, falling back to default:", err.message);
    return getFirestore(firebaseApp);
  }
}

const db = app ? createDb(app) : null;

// ── App Check (web only) ──────────────────────────────────────────────────────
// Prevents unauthenticated API abuse on web builds.
// Android requires @capacitor-firebase/app-check with Play Integrity instead.
// App Check enforcement must be enabled separately in the Firebase console
// AFTER confirming all deployed clients have this initialisation in place.
if (app && !Capacitor.isNativePlatform()) {
  const siteKey    = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const debugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;

  if (import.meta.env.DEV && debugToken) {
    // eslint-disable-next-line no-restricted-globals
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } else if (import.meta.env.DEV && debugToken) {
    // Debug token is set — use a placeholder provider; the token bypasses it.
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('placeholder-dev'),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

// Thin wrapper — safe to call even when analytics is null
export function track(eventName, params = {}) {
  if (analytics) logEvent(analytics, eventName, params);
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

const googleProvider = app ? new GoogleAuthProvider() : null;

function isUserCancellation(err) {
  const sig = `${err?.code ?? ""} ${err?.message ?? ""}`.toLowerCase();
  return sig.includes("cancel");
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase not configured");

  if (Capacitor.isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      const result = await FirebaseAuthentication.signInWithGoogle();

      if (!result?.credential?.idToken) {
        throw new Error("No ID token received from native Google sign-in.");
      }
      const credential    = GoogleAuthProvider.credential(result.credential.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    } catch (err) {
      if (isUserCancellation(err)) return null;
      console.error("[Firebase Native Auth] Google sign-in failed:", err);
      throw err;
    }
  } else {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    }
  }
}

export function subscribeToAuthState(callback) {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}

export async function signOutUser() {
  if (!auth) return;

  if (Capacitor.isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      await FirebaseAuthentication.signOut();
    } catch (err) {
      console.warn("[Firebase Native Auth] native signOut failed:", err.message);
    }
  }

  await signOut(auth);
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

export async function firestoreSet(uid, collection, data) {
  if (!db || !uid) return;
  try {
    await setDoc(
      doc(db, "users", uid, collection, "data"),
      { ...data, _updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    // Log visibly but do not re-throw — many callers are fire-and-forget and rely
    // on localStorage as the primary store; a Firestore write failure is non-fatal.
    console.warn("[Firestore] write failed (data is safe in localStorage):", err.message);
  }
}

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
