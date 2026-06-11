// Server-side subscription and commission management.
// Uses Firebase Admin SDK — bypasses Firestore security rules.
// Only call from trusted server code (webhooks, scheduled tasks).
// NEVER import this file from client-side code.

import { adminDb } from "./firebase.js";
import { FieldValue } from "firebase-admin/firestore";

export async function grantPremium(uid, plan, expiresAt = null) {
  if (!adminDb) throw new Error("Admin SDK not configured — set FIREBASE_SERVICE_ACCOUNT_JSON.");
  await adminDb.doc(`users/${uid}/subscription/status`).set({
    isPremium:  true,
    plan,
    expiresAt:  expiresAt ? new Date(expiresAt) : null,
    grantedAt:  FieldValue.serverTimestamp(),
    source:     "server",
  }, { merge: true });
}

export async function revokePremium(uid) {
  if (!adminDb) throw new Error("Admin SDK not configured — set FIREBASE_SERVICE_ACCOUNT_JSON.");
  await adminDb.doc(`users/${uid}/subscription/status`).set({
    isPremium:  false,
    plan:       "none",
    revokedAt:  FieldValue.serverTimestamp(),
    source:     "server",
  }, { merge: true });
}

// Records a referral commission exactly once per Play order.
//
// Idempotency: the entry document ID is derived from the Play orderId, and the
// whole operation runs in a transaction that aborts if the entry already
// exists. This matters because a single purchase reaches us twice — once via
// POST /api/billing/verify (client) and once via the RTDN webhook — and
// renewals fire the webhook every billing cycle with a fresh orderId.
//
// totalReferred counts unique referred users (tracked via a per-referredUid
// marker doc), while totalCommissionEarned accrues on every distinct order.
//
// `db` is injected (Admin Firestore in production) so the logic is testable.
export async function recordCommission(db, referrerUid, referredUid, purchaseAmount, orderId, rate = 0.15) {
  if (!db) throw new Error("Admin SDK not configured — set FIREBASE_SERVICE_ACCOUNT_JSON.");
  if (!orderId) throw new Error("recordCommission requires an orderId for idempotency.");

  const commission = parseFloat((purchaseAmount * rate).toFixed(2));
  const orderKey   = String(orderId).replace(/\//g, "_");

  const entryRef    = db.doc(`commissions/${referrerUid}/entries/${orderKey}`);
  const referredRef = db.doc(`commissions/${referrerUid}/referredUids/${referredUid}`);
  const profileRef  = db.doc(`users/${referrerUid}/profile/data`);

  return db.runTransaction(async (tx) => {
    const entrySnap = await tx.get(entryRef);
    if (entrySnap.exists) return { recorded: false, duplicate: true };

    const referredSnap = await tx.get(referredRef);
    const firstPurchaseByUser = !referredSnap.exists;

    const profileSnap = await tx.get(profileRef);
    const code = profileSnap.data()?.referralCode;

    tx.set(entryRef, {
      referredUid,
      orderId,
      purchaseAmount,
      commissionRate: rate,
      commission,
      paid:      false,
      timestamp: FieldValue.serverTimestamp(),
    });

    if (firstPurchaseByUser) {
      tx.set(referredRef, { firstOrderId: orderId, firstAt: FieldValue.serverTimestamp() });
    }

    if (code) {
      tx.set(db.doc(`referralCodes/${code}`), {
        totalCommissionEarned: FieldValue.increment(commission),
        ...(firstPurchaseByUser ? { totalReferred: FieldValue.increment(1) } : {}),
      }, { merge: true });
    }

    return { recorded: true, duplicate: false, commission };
  });
}
