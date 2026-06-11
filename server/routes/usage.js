// Card-usage tracking — enforces the free-tier daily card limit server-side.
// Writes to users/{uid}/usage/daily via Firebase Admin SDK (bypasses Firestore
// security rules) so clients cannot self-reset the counter via browser DevTools.
//
// Routes:
//   GET  /api/usage/card-count  — read current count (called at auth resolution)
//   POST /api/usage/record-card — increment counter  (called on each card advance)

import { Router } from 'express';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';
import { adminDb } from '../admin/firebase.js';

const router = Router();

export const FREE_DAILY_CARD_LIMIT = 5;

export function getTodayKey(now = new Date()) {
  return now.toISOString().split('T')[0];
}

export function hasReachedFreeDailyLimit(count) {
  return count >= FREE_DAILY_CARD_LIMIT;
}

export async function readCardUsage(db, uid, today = getTodayKey()) {
  const snap  = await db.doc(`users/${uid}/usage/daily`).get();
  const data  = snap.data() ?? {};
  const count = data.date === today ? (data.count ?? 0) : 0;
  return { count, limitReached: hasReachedFreeDailyLimit(count) };
}

export async function recordCardUsage(db, uid, today = getTodayKey()) {
  const ref = db.doc(`users/${uid}/usage/daily`);

  const count = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    const nextCount = (data.date === today ? (data.count ?? 0) : 0) + 1;
    await tx.set(ref, { date: today, count: nextCount });
    return nextCount;
  });

  return { ok: true, count, limitReached: hasReachedFreeDailyLimit(count) };
}

// ── GET /api/usage/card-count ─────────────────────────────────────────────────
// Returns { count, limitReached } for the authenticated user (UTC day).
router.get('/card-count', requireFirebaseAuth, async (req, res) => {
  if (!adminDb) {
    // Admin SDK absent — dev without service account; client enforces locally.
    return res.json({ count: 0, limitReached: false });
  }

  const uid = req.firebaseUser?.uid;
  if (!uid) return res.status(401).json({ error: 'Authentication required.' });

  const today = getTodayKey(); // UTC YYYY-MM-DD
  try {
    return res.json(await readCardUsage(adminDb, uid, today));
  } catch (err) {
    console.error('[Usage] card-count error:', err.message);
    // Fail open — don't block users because of a transient Firestore error.
    return res.json({ count: 0, limitReached: false });
  }
});

// ── POST /api/usage/record-card ───────────────────────────────────────────────
// Atomically increments the daily counter and returns the new count.
// Called once per card advance for free users (fire-and-forget from client).
router.post('/record-card', requireFirebaseAuth, async (req, res) => {
  if (!adminDb) {
    return res.json({ ok: true, count: 0, limitReached: false });
  }

  const uid = req.firebaseUser?.uid;
  if (!uid) return res.status(401).json({ error: 'Authentication required.' });

  const today = getTodayKey();

  try {
    return res.json(await recordCardUsage(adminDb, uid, today));
  } catch (err) {
    console.error('[Usage] record-card error:', err.message);
    // Fail open — never penalise users for server errors.
    return res.json({ ok: true, count: 0, limitReached: false });
  }
});

export default router;
