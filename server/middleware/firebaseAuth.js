// Firebase ID token verification middleware.
// Requires Firebase Admin SDK (FIREBASE_SERVICE_ACCOUNT_JSON env var).
// When Admin SDK is not configured:
//   - prod: returns 503 (fail closed — prevents unauthenticated Gemini usage
//            and protects paid quota from anonymous callers)
//   - dev:  silently passes through so local testing works without a service account

import { adminAuth } from "../admin/firebase.js";

export async function requireFirebaseAuth(req, res, next) {
  if (!adminAuth) {
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        error: "Authentication service not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON on the server."
      });
    }
    // Development only — skip auth to allow local testing without a service account.
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header required (Bearer <firebase-id-token>)." });
  }

  try {
    req.firebaseUser = await adminAuth.verifyIdToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: "Firebase token invalid or expired." });
  }
}
