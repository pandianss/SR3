// Subscription management — feature gates and Play Billing integration.
//
// Free tier:   Low Energy mode only · ABM + BFM subjects · 5 cards/day · no AI
// Premium:     All modes · All subjects + electives · unlimited · AI features
//
// Billing is handled by Google Play Billing API (via Capacitor in production).
// In dev/web, a mock override is available via Firestore flag or localStorage.

import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const PLANS = {
  monthly: {
    id: "monthly",
    productId: "caiib_premium_monthly",   // must match Play Console product ID exactly
    label: "Monthly",
    price: "₹149",
    period: "/ month",
    savings: null,
  },
  yearly: {
    id: "yearly",
    productId: "caiib_premium_yearly",
    label: "Yearly",
    price: "₹999",
    period: "/ year",
    savings: "Save 44%",
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
  // Dev override — set localStorage key to test premium UI
  if (localStorage.getItem("caiib_dev_premium") === "true") {
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
