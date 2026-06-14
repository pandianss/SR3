// Subscription management — feature gates and Play Billing integration.
//
// Free tier:   Low Energy mode only · ABM + BFM subjects · 5 cards/day · no AI
// Premium:     All modes · All subjects + electives · unlimited · AI features
//
// Billing is handled by Google Play Billing API (via Capacitor in production).
// Premium is GRANTED and REVOKED server-side only — see server/admin/subscriptions.js.
// The client reads entitlement from Firestore but can never write it.

import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// ── Pricing strategy ─────────────────────────────────────────────────────────
export const PLANS = {
  // basePlanId MUST match the base-plan ID configured for each subscription
  // product in Play Console (Monetise → Subscriptions → <product> → Base plans).
  // Android subscription purchases require it; iOS ignores it. If these strings
  // don't match Play Console exactly, purchaseProduct() fails on device.
  monthly: {
    id:         "monthly",
    productId:  "caiib_premium_monthly",
    basePlanId: "monthly-plan",
    label:      "Monthly",
    price:      "₹149",
    priceNum:   149,
    period:     "/ month",
    months:     1,
    badge:      null,
    highlight:  false,
  },
  exam: {
    id:         "exam",
    productId:  "caiib_premium_3month",
    basePlanId: "exam-plan",
    label:      "Exam Ready",
    price:      "₹349",
    priceNum:   349,
    period:     "/ 3 months",
    months:     3,
    badge:      "Most Popular",
    highlight:  true,
  },
  yearly: {
    id:         "yearly",
    productId:  "caiib_premium_yearly",
    basePlanId: "yearly-plan",
    label:      "Yearly",
    price:      "₹999",
    priceNum:   999,
    period:     "/ year",
    months:     12,
    badge:      "Best Value",
    highlight:  false,
  },
};

// productId → base plan ID, for the Android purchase flow.
const BASE_PLAN_BY_PRODUCT = Object.fromEntries(
  Object.values(PLANS).map((p) => [p.productId, p.basePlanId])
);

export const PREMIUM_FEATURES = {
  deepFocusMode:  "Deep Focus Mode (numerical scenarios + AI case studies)",
  rapidRevision:  "Rapid Revision Mode (formula drills)",
  allSubjects:    "ABFM, BRBL & Elective subjects",
  aiCoach:        "AI Coach explanations",
  unlimitedCards: "Unlimited daily cards (free: 5/day)",
};

export const FREE_DAILY_CARD_LIMIT = 5;
export const FREE_SUBJECTS = ["ABM", "BFM"];

// ── Subscription state helpers ────────────────────────────────────────────────

export async function loadSubscriptionStatus(uid) {
  // Dev override — gated to dev builds only, cannot unlock premium in the APK.
  if (import.meta.env.DEV && localStorage.getItem("caiib_dev_premium") === "true") {
    return { isPremium: true, expiresAt: null, plan: "dev", source: "dev_override" };
  }

  if (!db || !uid) return defaultFreeStatus();

  try {
    const snap = await getDoc(doc(db, "users", uid, "subscription", "status"));
    if (!snap.exists()) return defaultFreeStatus();

    const data      = snap.data();
    const now       = Date.now();
    const expiresAt = data.expiresAt?.toMillis?.() ?? 0;
    const isPremium = data.isPremium === true && (expiresAt === 0 || expiresAt > now);

    return { isPremium, expiresAt, plan: data.plan ?? "none", source: "firestore" };
  } catch {
    return defaultFreeStatus();
  }
}

function defaultFreeStatus() {
  return { isPremium: false, expiresAt: null, plan: "none", source: "default" };
}

// ── Feature gate helpers ──────────────────────────────────────────────────────

export function canUseMode(energyMode, isPremium) {
  if (isPremium) return true;
  return energyMode === "low";
}

export function canStudySubject(subjectId, isPremium) {
  if (isPremium) return true;
  return FREE_SUBJECTS.includes(subjectId);
}

export function canUseAI(isPremium) {
  return isPremium;
}

// ── Google Play Billing (Capacitor) ──────────────────────────────────────────

const API_BASE = typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : '';

export async function initBilling() {
  try {
    const { NativePurchases } = await import("@capgo/native-purchases");
    // On web (and any platform without a Play/StoreKit billing client) this
    // reports false, so callers fall back to the Play Store listing.
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    return isBillingSupported ? NativePurchases : null;
  } catch {
    return null;
  }
}

/**
 * Launch the Play billing flow for a subscription, then immediately
 * verify the purchase with our backend to grant premium without waiting
 * for the RTDN webhook.
 *
 * @param {string} productId   - Google Play product ID (e.g. "caiib_premium_3month")
 * @param {string|null} uid    - Firebase UID of the purchasing user
 * @param {Function} getToken  - Async fn that returns a Firebase ID token string
 */
export async function purchaseSubscription(productId, uid = null, getToken = null) {
  const billing = await initBilling();
  if (!billing) {
    window.open(
      `https://play.google.com/store/apps/details?id=com.superrecall.caiib`,
      "_blank"
    );
    return { success: false, reason: "web_fallback" };
  }

  try {
    const { products } = await billing.getProducts({
      productIdentifiers: [productId],
      productType: "subs",
    });
    if (!products?.length) return { success: false, reason: "product_not_found" };

    // Pass the Firebase UID to Play as appAccountToken — on Android this maps to
    // obfuscatedExternalAccountId, which the server reads (extractUid) to bind the
    // purchase token to this user during /verify and the RTDN webhook.
    const purchaseOptions = {
      productIdentifier: productId,
      productType: "subs",
      ...(BASE_PLAN_BY_PRODUCT[productId] ? { planIdentifier: BASE_PLAN_BY_PRODUCT[productId] } : {}),
      ...(uid ? { appAccountToken: uid } : {}),
    };

    const result = await billing.purchaseProduct(purchaseOptions);

    // Immediately verify and grant premium without waiting for the webhook.
    const purchaseToken = result?.purchaseToken ?? result?.transactionId ?? null;

    if (purchaseToken && uid && getToken) {
      try {
        const idToken = await getToken();
        const res = await fetch(`${API_BASE}/api/billing/verify`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body:   JSON.stringify({ purchaseToken, subscriptionId: productId }),
          signal: AbortSignal.timeout(20_000),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error('[Billing] Server verification failed:', data.error);
          // Still return success — RTDN webhook will reconcile asynchronously.
        } else {
          return { success: true, verified: true, ...data };
        }
      } catch (verifyErr) {
        console.warn('[Billing] Verify request failed (webhook will reconcile):', verifyErr.message);
      }
    }

    return { success: true, verified: false };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}
