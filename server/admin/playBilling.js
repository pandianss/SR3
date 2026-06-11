// Google Play Developer API — purchase token verification.
//
// Prerequisites (one-time setup):
//   1. In Google Play Console → Setup → API access → link to a Google Cloud project.
//   2. Grant the service account (FIREBASE_SERVICE_ACCOUNT_JSON) the role
//      "Release manager" or create a custom role with androidpublisher permission.
//   3. Enable the Android Publisher API in the linked Cloud project at:
//      https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com
//
// Client-side requirement:
//   When launching the Google Play Billing flow, pass the Firebase UID as the
//   obfuscated account ID so the server can map token → user without a lookup table:
//
//     BillingFlowParams.newBuilder()
//       .setObfuscatedAccountId(firebaseUser.uid)
//       ...

import { GoogleAuth } from 'google-auth-library';

const PACKAGE_NAME  = 'com.superrecall.caiib';
const PLAY_API_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3';

let _auth = null;

function getPlayAuth() {
  if (_auth) return _auth;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;

  try {
    _auth = new GoogleAuth({
      credentials: JSON.parse(json),
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    return _auth;
  } catch (err) {
    console.error('[PlayBilling] Failed to initialise auth:', err.message);
    return null;
  }
}

export function isPlayAuthConfigured() {
  return getPlayAuth() !== null;
}

/**
 * Fetch a SubscriptionPurchaseV2 object from the Play Developer API.
 * Throws on network error or invalid token.
 */
export async function getSubscription(subscriptionId, purchaseToken) {
  const auth = getPlayAuth();
  if (!auth) throw new Error('Play billing auth not configured — FIREBASE_SERVICE_ACCOUNT_JSON required.');

  const client  = await auth.getClient();
  const url     = `${PLAY_API_BASE}/applications/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  const res = await client.request({ url, timeout: 15_000 });
  return res.data;   // SubscriptionPurchaseV2
}

/**
 * Extract the Firebase UID that was set as obfuscatedExternalAccountId
 * when the billing flow was launched.
 */
export function extractUid(subscriptionData) {
  return subscriptionData?.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null;
}

/**
 * True when the subscription is in a state that entitles the user to access.
 * SUBSCRIPTION_STATE_IN_GRACE_PERIOD = payment failed but still entitled.
 */
export function isActive(subscriptionData) {
  return ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']
    .includes(subscriptionData?.subscriptionState);
}

/**
 * Returns the Play order ID for the latest transaction on this subscription.
 * Renewals get a fresh orderId (GPA.xxxx..0, ..1, ...), so it doubles as an
 * idempotency key for per-cycle commission recording.
 */
export function getOrderId(subscriptionData) {
  return subscriptionData?.latestOrderId
    ?? subscriptionData?.lineItems?.[0]?.latestSuccessfulOrderId
    ?? null;
}

/**
 * Returns the subscription expiry as a Unix timestamp (ms), or null if
 * indefinite / not available (e.g. lifetime grants).
 */
export function getExpiryMs(subscriptionData) {
  const expiryTime = subscriptionData?.lineItems?.[0]?.expiryTime;
  return expiryTime ? new Date(expiryTime).getTime() : null;
}
