// syncStore — unified read/write layer
// Every key is stored in localStorage immediately (offline support)
// and mirrored to Firestore when a user is signed in.
//
// Usage:
//   import { syncRead, syncWrite } from "./syncStore";
//   const profile = await syncRead(uid, "profile", "caiib_user_profile");
//   await syncWrite(uid, "profile", "caiib_user_profile", data);

import { firestoreGet, firestoreSet } from "./firebase";

/**
 * Write data to localStorage + Firestore.
 * @param {string|null} uid   - Firebase UID (null = localStorage only)
 * @param {string} collection - Firestore sub-collection name
 * @param {string} localKey   - localStorage key
 * @param {any}    data       - plain serialisable object or primitive
 */
export async function syncWrite(uid, collection, localKey, data) {
  // Always write locally first so the app stays responsive
  try {
    localStorage.setItem(localKey, JSON.stringify(data));
  } catch (e) {
    console.warn("[syncStore] localStorage write failed:", e);
  }

  // Mirror to Firestore if signed in
  if (uid) {
    await firestoreSet(uid, collection, typeof data === "object" && data !== null ? data : { value: data });
  }
}

/**
 * Read data, preferring Firestore (freshest) then localStorage fallback.
 * @param {string|null} uid
 * @param {string} collection
 * @param {string} localKey
 * @returns {Promise<any>} parsed data or null
 */
export async function syncRead(uid, collection, localKey) {
  // Try Firestore first if signed in
  if (uid) {
    const remote = await firestoreGet(uid, collection);
    if (remote !== null) {
      // Keep localStorage in sync with freshest remote data
      try { localStorage.setItem(localKey, JSON.stringify(remote)); } catch (_) {}
      return remote;
    }
  }

  // Fall back to localStorage
  try {
    const raw = localStorage.getItem(localKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Synchronous local-only read — for code paths that can't await
 * (e.g. SM-2 engine hot paths). Firestore sync happens separately.
 */
export function localRead(localKey) {
  try {
    const raw = localStorage.getItem(localKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function localWrite(localKey, data) {
  try {
    localStorage.setItem(localKey, JSON.stringify(data));
  } catch (e) {
    console.warn("[syncStore] localStorage write failed:", e);
  }
}

/**
 * Ensure a profile loaded from storage/Firestore has all new fields
 * with safe defaults. Existing values are never overwritten.
 * Also the caller should { merge: true } on the next Firestore write
 * so remote documents are backfilled automatically.
 */
export function ensureProfileDefaults(profile) {
  return {
    streak: 0,
    xp: 0,
    level: 1,
    careerTitle: "Novice",
    lastActiveDateUTC: "",
    partnerIds: [],
    ...profile,
  };
}
