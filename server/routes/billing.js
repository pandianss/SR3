// Google Play Billing routes.
//
// handleBillingWebhook — RTDN push from Pub/Sub (server-to-server, no user auth).
//   Exported as a named function and mounted BEFORE the global rate-limiter and
//   internal-token middleware in server.js because Google Pub/Sub push
//   subscriptions cannot inject custom headers.
//   Request authenticity is verified via the Google-signed OIDC token that
//   Pub/Sub attaches in the Authorization header.
//
// POST /api/billing/verify — called by the app immediately after a purchase
//   completes (requires Firebase ID token).  This handles the initial grant
//   synchronously so the user doesn't wait for the RTDN webhook.
//
// Setup guide:
//   1. Google Play Console → App → Monetise → Subscriptions → Set up RTDN
//   2. Create a Cloud Pub/Sub topic in the same GCP project as Firebase.
//   3. Add a Push subscription pointing to: https://api.superrecall.in/api/billing/webhook
//   4. Set PUBSUB_SA_EMAIL to the Pub/Sub service-account email shown in the
//      subscription details (looks like service-NNNNN@gcp-sa-pubsub.iam.gserviceaccount.com).
//   5. Set PUBSUB_AUDIENCE_URL to the full webhook URL above.

import { Router }         from 'express';
import { OAuth2Client }   from 'google-auth-library';
import { grantPremium, revokePremium, recordCommission } from '../admin/subscriptions.js';
import { adminDb }        from '../admin/firebase.js';
import {
  getSubscription,
  extractUid,
  isActive,
  getExpiryMs,
  getOrderId,
  isPlayAuthConfigured,
} from '../admin/playBilling.js';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';

const router      = Router();
const pubsubClient = new OAuth2Client();

const PRODUCT_MAP = {
  caiib_premium_monthly: { id: 'monthly', months: 1,  priceInr: 149 },
  caiib_premium_3month:  { id: 'exam',    months: 3,  priceInr: 349 },
  caiib_premium_yearly:  { id: 'yearly',  months: 12, priceInr: 999 },
};

// RTDN notificationType values
// https://developer.android.com/google/play/billing/rtdn-reference
const GRANT_TYPES  = new Set([1, 2, 4, 7]);   // PURCHASED, RENEWED, PURCHASED_FROM_OFFER, RESTARTED
const REVOKE_TYPES = new Set([3, 12, 13]);     // CANCELED, REVOKED, EXPIRED

// ── Commission helper ─────────────────────────────────────────────────────────
// orderId keys the idempotency check inside recordCommission — a purchase that
// arrives via both /verify and the RTDN webhook is recorded only once.
async function maybeRecordCommission(uid, plan, orderId) {
  if (!adminDb || !orderId) return;
  try {
    const profileSnap   = await adminDb.doc(`users/${uid}/profile/data`).get();
    const referredByUid = profileSnap.data()?.referredByUid;
    if (referredByUid) {
      const result = await recordCommission(adminDb, referredByUid, uid, plan.priceInr, orderId);
      if (result.recorded) {
        console.log('[Billing] Commission recorded — referrer:', referredByUid, 'amount: ₹' + plan.priceInr, 'order:', orderId);
      }
    }
  } catch (err) {
    // Non-fatal: the subscription grant already succeeded.
    console.error('[Billing] Commission recording failed (non-fatal):', err.message);
  }
}

// ── Pub/Sub OIDC token verification ──────────────────────────────────────────
// Google Pub/Sub push subscriptions attach a Google-signed OIDC token to every
// delivery request.  Verify the token so attackers who discover the endpoint
// URL cannot forge webhook events and grant themselves premium.
async function verifyPubSubToken(req) {
  const token    = req.headers.authorization?.slice(7);
  const audience = process.env.PUBSUB_AUDIENCE_URL;
  const saEmail  = process.env.PUBSUB_SA_EMAIL;

  if (!audience || !saEmail) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Billing/webhook] PUBSUB_AUDIENCE_URL and PUBSUB_SA_EMAIL must be set in production.');
      return false;
    }
    // Dev: skip verification with a warning.
    console.warn('[Billing/webhook] OIDC verification skipped — set PUBSUB_AUDIENCE_URL + PUBSUB_SA_EMAIL.');
    return true;
  }

  if (!token) {
    console.warn('[Billing/webhook] Missing Authorization header from Pub/Sub.');
    return false;
  }

  try {
    const ticket = await pubsubClient.verifyIdToken({ idToken: token, audience });
    const email  = ticket.getPayload()?.email;
    if (email !== saEmail) {
      console.warn(`[Billing/webhook] OIDC service-account email mismatch: ${email} !== ${saEmail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Billing/webhook] OIDC verification failed:', err.message);
    return false;
  }
}

// ── POST /api/billing/webhook ─────────────────────────────────────────────────
// Exported and mounted in server.js BEFORE the rate-limiter and internal-token
// middleware so Google Pub/Sub can reach it without custom request headers.
export async function handleBillingWebhook(req, res) {
  // Always ACK immediately — Play retries on non-2xx.
  res.status(200).json({ ok: true });

  // Verify the Pub/Sub OIDC token (async, after the ACK).
  const authentic = await verifyPubSubToken(req);
  if (!authentic) return;

  try {
    const messageData = req.body?.message?.data;
    if (!messageData) return;

    const decoded = JSON.parse(Buffer.from(messageData, 'base64').toString('utf8'));

    if (decoded.testNotification) {
      console.log('[Billing] Play Store test notification received.');
      return;
    }

    const { subscriptionNotification } = decoded;
    if (!subscriptionNotification) return;

    const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;
    const plan = PRODUCT_MAP[subscriptionId];
    if (!plan) {
      console.warn('[Billing/webhook] Unknown subscriptionId:', subscriptionId);
      return;
    }

    if (!isPlayAuthConfigured()) {
      console.error('[Billing/webhook] Play API not configured — cannot verify token. Set FIREBASE_SERVICE_ACCOUNT_JSON.');
      return;
    }

    const subData = await getSubscription(subscriptionId, purchaseToken);
    const uid     = extractUid(subData);

    if (!uid) {
      console.error(
        '[Billing/webhook] obfuscatedExternalAccountId missing — cannot identify user.\n' +
        '  Ensure BillingFlowParams.setObfuscatedAccountId(firebaseUid) is called before purchase.\n' +
        '  Token prefix:', purchaseToken?.slice(0, 20)
      );
      return;
    }

    if (GRANT_TYPES.has(notificationType)) {
      const expiresAt = getExpiryMs(subData) ?? (Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000);
      await grantPremium(uid, plan.id, expiresAt);
      console.log('[Billing/webhook] Premium granted:', uid, plan.id, new Date(expiresAt).toISOString());
      await maybeRecordCommission(uid, plan, getOrderId(subData) ?? purchaseToken);

    } else if (REVOKE_TYPES.has(notificationType)) {
      await revokePremium(uid);
      console.log('[Billing/webhook] Premium revoked:', uid, '— type:', notificationType);
    }

  } catch (err) {
    console.error('[Billing/webhook] Processing error:', err.message);
  }
}

// ── POST /api/billing/verify ──────────────────────────────────────────────────
// Called by the app immediately after a Play purchase completes.
// Body: { purchaseToken: string, subscriptionId: string }
// Requires: Authorization: Bearer <firebase-id-token>
router.post('/verify', requireFirebaseAuth, async (req, res) => {
  const { purchaseToken, subscriptionId } = req.body ?? {};

  if (!purchaseToken || typeof purchaseToken !== 'string') {
    return res.status(400).json({ error: 'purchaseToken (string) is required.' });
  }
  if (!subscriptionId || typeof subscriptionId !== 'string') {
    return res.status(400).json({ error: 'subscriptionId (string) is required.' });
  }

  const plan = PRODUCT_MAP[subscriptionId];
  if (!plan) {
    return res.status(400).json({ error: `Unknown subscriptionId: ${subscriptionId}` });
  }

  if (!isPlayAuthConfigured()) {
    return res.status(503).json({ error: 'Billing verification is not configured on this server.' });
  }

  const uid = req.firebaseUser?.uid;
  if (!uid) {
    return res.status(401).json({ error: 'Firebase authentication required.' });
  }

  try {
    const subData = await getSubscription(subscriptionId, purchaseToken);

    if (!isActive(subData)) {
      return res.status(402).json({ error: 'Subscription is not in an active state.' });
    }

    // Verify purchase token belongs to the authenticated user (prevents token-sharing fraud).
    const tokenUid = extractUid(subData);
    if (tokenUid && tokenUid !== uid) {
      console.error('[Billing/verify] UID mismatch — token owner:', tokenUid, 'auth user:', uid);
      return res.status(403).json({ error: 'Purchase token does not belong to this account.' });
    }

    const expiresAt = getExpiryMs(subData) ?? (Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000);
    await grantPremium(uid, plan.id, expiresAt);
    await maybeRecordCommission(uid, plan, getOrderId(subData) ?? purchaseToken);

    console.log('[Billing/verify] Premium granted:', uid, plan.id, new Date(expiresAt).toISOString());
    res.json({ ok: true, plan: plan.id, expiresAt });

  } catch (err) {
    console.error('[Billing/verify] Error:', err.message);
    res.status(502).json({ error: 'Purchase verification failed. Please try again.' });
  }
});

export default router;
