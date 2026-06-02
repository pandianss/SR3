// Subscription management — feature gates and Play Billing integration.
//
// Free tier:   Low Energy mode only · ABM + BFM subjects · 5 cards/day · no AI
// Premium:     All modes · All subjects + electives · unlimited · AI features
//
// Billing is handled by Google Play Billing API (via Capacitor in production).
// In dev/web, a mock override is available via Firestore flag or localStorage.

import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// ── Pricing strategy ─────────────────────────────────────────────────────────
// CAIIB candidates think in exam cycles (3–4 months before May/Nov attempt).
// The 3-month "Exam Ready" plan is the conversion hero — priced to close.
// Monthly exists for impulse buyers; Yearly for repeat takers / serious students.
//
// After Google Play's 15% cut:
//   Monthly  ₹149  → ₹126.65/month net
//   3-Month  ₹349  → ₹296.65 net  (₹98.88/month net)
//   Yearly   ₹999  → ₹849.15 net  (₹70.76/month net)
//
// Referral commission (15%): Monthly ₹22 · 3-Month ₹52 · Yearly ₹150

export const PLANS = {
  monthly: {
    id:        "monthly",
    productId: "caiib_premium_monthly",   // must match Play Console product ID exactly
    label:     "Monthly",
    price:     "₹149",
    priceNum:  149,
    period:    "/ month",
    months:    1,
    badge:     null,
    highlight: false,
  },
  exam: {
    id:        "exam",
    productId: "caiib_premium_3month",
    label:     "Exam Ready",
    price:     "₹349",
    priceNum:  349,
    period:    "/ 3 months",
    months:    3,
    badge:     "Most Popular",
    highlight: true,          // shown as hero option in paywall
  },
  yearly: {
    id:        "yearly",
    productId: "caiib_premium_yearly",
    label:     "Yearly",
    price:     "₹999",
    priceNum:  999,
    period:    "/ year",
    months:    12,
    badge:     "Best Value",
    highlight: false,
  },
};

// Features gated behind premium
export const PREMIUM_FEATURES = {
  deepFocusMode:    "Deep Focus Mode (numerical scenarios + AI case studies)",
  rapidRevision:    "Rapid Revision Mode (formula drills)",
  allSubjects:      "ABFM, BRBL & Elective subjects",
  aiCoach:          "AI Coach explanations",
  unlimitedCards:   "Unlimited daily cards (free: 5/day)",
};

export const FREE_DAILY_CARD_LIMIT = 5;
export const FREE_SUBJECTS = ["ABM", "BFM"]; // free users can study these

// ── Subscription state helpers ────────────────────────────────────────────────

/**
 * Load subscription status for a user.
 * Checks Firestore first, then localStorage fallback.
 * Returns { isPremium, expiresAt, plan, source }
 */
export async function loadSubscriptionStatus(uid) {
  // Dev override — set localStorage key to test premium UI.
  // Gated to dev builds so it cannot be used to unlock premium in the shipped APK.
  if (import.meta.env.DEV && localStorage.getItem("caiib_dev_premium") === "true") {
    return { isPremium: true, expiresAt: null, plan: "dev", source: "dev_override" };
  }

  if (!db || !uid) return defaultFreeStatus();

  try {
    const snap = await getDoc(doc(db, "users", uid, "subscription", "status"));
    if (!snap.exists()) return defaultFreeStatus();

    const data = snap.data();
    const now  = Date.now();
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

/**
 * Write subscription status to Firestore.
 * Called from the server-side Play Billing webhook (or manually for beta testers).
 */
export async function grantPremium(uid, plan, expiresAt = null) {
  if (!db || !uid) return;
  await setDoc(doc(db, "users", uid, "subscription", "status"), {
    isPremium: true,
    plan,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    grantedAt: serverTimestamp(),
  }, { merge: true });
}

export async function revokePremium(uid) {
  if (!db || !uid) return;
  await setDoc(doc(db, "users", uid, "subscription", "status"), {
    isPremium: false,
    plan: "none",
    revokedAt: serverTimestamp(),
  }, { merge: true });
}

// ── Feature gate helpers ──────────────────────────────────────────────────────

export function canUseMode(energyMode, isPremium) {
  if (isPremium) return true;
  return energyMode === "low"; // free users: Low Energy only
}

export function canStudySubject(subjectId, isPremium) {
  if (isPremium) return true;
  return FREE_SUBJECTS.includes(subjectId);
}

export function canUseAI(isPremium) {
  return isPremium;
}

// ── Google Play Billing (Capacitor) ──────────────────────────────────────────
// Full integration requires @capacitor-community/in-app-purchases.
// Stubbed here; wired up when the Play Console products are live.

export async function initBilling() {
  // @capacitor-community/in-app-purchases is only available inside the APK.
  // We use a string-based import via Function() so Vite doesn't try to
  // statically resolve the module in web/dev builds.
  try {
    // eslint-disable-next-line no-new-func
    const { InAppPurchases } = await new Function('return import("@capacitor-community/in-app-purchases")')();
    await InAppPurchases.initialize();
    return InAppPurchases;
  } catch {
    return null; // web/dev — billing not available
  }
}

export async function purchaseSubscription(productId) {
  const billing = await initBilling();
  if (!billing) {
    // Web fallback — open Play Store URL
    window.open(
      `https://play.google.com/store/apps/details?id=com.superrecall.caiib`,
      "_blank"
    );
    return { success: false, reason: "web_fallback" };
  }
  try {
    const { products } = await billing.getProducts({ productIds: [productId] });
    if (!products?.length) return { success: false, reason: "product_not_found" };
    await billing.purchaseProduct({ productId });
    return { success: true };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}
