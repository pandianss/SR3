// Referral system — code generation, Firestore linkage, stats.
//
// Referral code format: 4 letters from display name + 4 random alphanumeric chars
// e.g. "DHRU8K2P". Uppercase, no ambiguous chars (0/O, 1/I).
//
// Commission recording is server-side only — see server/admin/subscriptions.js.
// The client can read commission data but never write it.

import { db } from "./firebase";
import {
  doc, getDoc, setDoc, collection,
  getDocs, updateDoc, increment,
  serverTimestamp
} from "firebase/firestore";

const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(n) {
  return Array.from({ length: n }, () =>
    SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  ).join("");
}

export async function generateReferralCode(displayName = "") {
  if (!db) return null;

  const prefix = (displayName || "USER")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4)
    .padEnd(4, "X");

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = prefix + randomChars(4);
    const ref  = doc(db, "referralCodes", code);
    const snap = await getDoc(ref);
    if (!snap.exists()) return code;
  }

  return randomChars(8);
}

export async function registerReferralCode(uid, code) {
  if (!db || !uid || !code) return;
  await setDoc(doc(db, "referralCodes", code), {
    ownerUid:             uid,
    totalReferred:        0,
    totalCommissionEarned: 0,
    createdAt:            serverTimestamp(),
  });
}

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

export async function linkReferral(newUid, referralCode) {
  if (!db || !newUid || !referralCode) return false;

  const codeData = await resolveReferralCode(referralCode);
  if (!codeData) return false;
  if (codeData.ownerUid === newUid) return false;

  await setDoc(
    doc(db, "users", newUid, "profile", "data"),
    { referredBy: referralCode, referredByUid: codeData.ownerUid },
    { merge: true }
  );

  // Counter update is denied by Firestore rules in production (Admin-only).
  // The server reconciles the count from `referredBy` stamps on each profile.
  try {
    await updateDoc(doc(db, "referralCodes", referralCode), {
      totalReferred: increment(1),
    });
  } catch {
    /* expected denial in prod */
  }

  return true;
}

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
    code:                  referralCode,
    totalReferred:         codeData.totalReferred          ?? 0,
    totalCommissionEarned: codeData.totalCommissionEarned  ?? 0,
    unpaidCommission:      parseFloat(unpaid.toFixed(2)),
    entries,
  };
}
