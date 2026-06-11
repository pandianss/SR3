// Firebase Admin SDK — server-side only.
// Obtain a service account key from:
//   Firebase Console → Project Settings → Service Accounts → Generate new private key
// Paste the full JSON as a single line in FIREBASE_SERVICE_ACCOUNT_JSON env var.

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore }  from "firebase-admin/firestore";
import { getAuth }       from "firebase-admin/auth";
import { getMessaging }  from "firebase-admin/messaging";

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    console.warn(
      "[Admin] FIREBASE_SERVICE_ACCOUNT_JSON not set — Admin SDK disabled.\n" +
      "        Subscription webhooks and server-side Firestore writes will not work."
    );
    return null;
  }

  try {
    const app = initializeApp({ credential: cert(JSON.parse(json)) });
    console.log("[Admin] Firebase Admin SDK initialised.");
    return app;
  } catch (err) {
    console.error("[Admin] Failed to initialise Admin SDK:", err.message);
    return null;
  }
}

const adminApp = initAdmin();

export const adminDb   = adminApp ? getFirestore(adminApp) : null;
export const adminAuth = adminApp ? getAuth(adminApp)       : null;
export const adminMsg  = adminApp ? getMessaging(adminApp)  : null;
