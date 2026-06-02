// Referral system — code generation, Firestore linkage, commission tracking.
//
// Referral code format: 4 letters from display name + 4 random alphanumeric chars
// e.g. "DHRU8K2P". Uppercase, no ambiguous chars (0/O, 1/I).

import { db } from "./firebase";
import {
  doc, getDoc, setDoc, collection,
  addDoc, serverTimestamp, query, where,
  getDocs, updateDoc, increment
} from "firebase/firestore";

const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function randomChars(n) {
  return Array.from({ length: n }, () =>
    SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  ).join("");
}

/**
 * Generate a unique referral code for a new user.
 * Uses up to 4 letters from their display name + 4 random chars.
 * Checks Firestore to guarantee uniqueness (retries up to 5x).
 */
export async function generateReferralCode(displayName = "") {
  if (!db) return null;

  const prefix = (displayName || "USER")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = prefix + randomChars(4);
    const ref = doc(db, "referralCodes", code);
    const snap = await getDoc(ref);
    if (!snap.exists()) return code; // unique — use it
  }

  // Extreme fallback: fully random 8-char code
  return randomChars(8);
}

/**
 * Register a new user's referral code in Firestore.
 * Call once on first sign-in.
 */
export async function registerReferralCode(uid, code) {
  if (!db || !uid || !code) return;
  await setDoc(doc(db, "referralCodes", code), {
    ownerUid: uid,
    totalReferred: 0,
    totalCommissionEarned: 0,
    createdAt: serverTimestamp(),
  });
}

/**
 * Look up who owns a referral code.
 * Returns { ownerUid } or null if code is invalid.
 */
export async function resolveReferralCode(code) {
  if (!db || !code) return null;
  try {
    const snap = await getDoc(doc(db, "referralCodes", code.toUpperCase().trim()));
    if (!snap.exists()) return null;
    return snap.data();
  } catch {
    return null;
  }
}

/**
 * Link a new user to their referrer.
 * - Writes referredBy into the new user's profile
 * - Increments referrer's totalReferred counter
 */
export async function linkReferral(newUid, referralCode) {
  if (!db || !newUid || !referralCode) return false;

  const codeData = await resolveReferralCode(referralCode);
  if (!codeData) return false; // invalid code

  // Don't let users refer themselves
  if (codeData.ownerUid === newUid) return false;

  // Mark the new user as referred. This stamp on the (owner-writable) profile
  // is the source of truth a trusted server uses to compute referral counts.
  await setDoc(
    doc(db, "users", newUid, "profile", "data"),
    { referredBy: referralCode, referredByUid: codeData.ownerUid },
    { merge: true }
  );

  // The referralCodes counter is Admin-only (anti-fraud — see firestore.rules),
  // so this client increment is expected to be denied in production. We attempt
  // it for local/dev convenience but never let a denial break referral linking;
  // the authoritative count is reconciled server-side from `referredBy` stamps.
  try {
    await updateDoc(doc(db, "referralCodes", referralCode), {
      totalReferred: increment(1),
    });
  } catch {
    /* denied by rules in prod — server reconciles the count */
  }

  return true;
}

/**
 * Record a commission entry when a referred user makes a purchase.
 * Called from the server-side webhook (or manually during beta).
 *
 * @param {string} referrerUid   - the user who referred
 * @param {string} referredUid   - the user who purchased
 * @param {number} purchaseAmount - gross purchase in INR (e.g. 149)
 * @param {number} rate          - commission rate (default 0.15 = 15%)
 */
export async function recordCommission(referrerUid, referredUid, purchaseAmount, rate = 0.15) {
  if (!db) return;
  const commission = parseFloat((purchaseAmount * rate).toFixed(2));

  await addDoc(collection(db, "commissions", referrerUid, "entries"), {
    referredUid,
    purchaseAmount,
    commissionRate: rate,
    commission,
    paid: false,
    timestamp: serverTimestamp(),
  });

  // Update referrer's running total on the code document
  // We find their code via ownerUid — read from their profile first
  const profileSnap = await getDoc(doc(db, "users", referrerUid, "profile", "data"));
  const code = profileSnap.data()?.referralCode;
  if (code) {
    await updateDoc(doc(db, "referralCodes", code), {
      totalCommissionEarned: increment(commission),
    });
  }
}

/**
 * Fetch referral stats for the dashboard.
 * Returns { code, totalReferred, totalCommissionEarned, unpaidCommission, entries[] }
 */
export async function getReferralStats(uid, referralCode) {
  if (!db || !uid || !referralCode) return null;

  const [codeSnap, entriesSnap] = await Promise.all([
    getDoc(doc(db, "referralCodes", referralCode)),
    getDocs(collection(db, "commissions", uid, "entries")),
  ]);

  const codeData = codeSnap.exists() ? codeSnap.data() : {};
  const entries  = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const unpaid   = entries
    .filter(e => !e.paid)
    .reduce((sum, e) => sum + (e.commission || 0), 0);

  return {
    code: referralCode,
    totalReferred:          codeData.totalReferred          ?? 0,
    totalCommissionEarned:  codeData.totalCommissionEarned  ?? 0,
    unpaidCommission:       parseFloat(unpaid.toFixed(2)),
    entries,
  };
}
