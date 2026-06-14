import 'dotenv/config';
import { randomUUID } from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { requireInternalToken } from './middleware/auth.js';
import { globalLimiter } from './middleware/rateLimit.js';
import geminiRouter    from './routes/gemini.js';
import circularsRouter, { startBackgroundScraper } from './routes/circulars.js';
import billingRouter, { handleBillingWebhook } from './routes/billing.js';
import usageRouter     from './routes/usage.js';
import { adminDb }     from './admin/firebase.js';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Production guards ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  console.error('[Server] FATAL: CORS_ORIGIN must be set in production. Exiting.');
  process.exit(1);
}

// Without these the Pub/Sub OIDC check in handleBillingWebhook cannot run, which
// would leave the billing webhook open to forged RTDN events. Fail fast rather
// than silently disabling forgery protection in production.
if (process.env.NODE_ENV === 'production' &&
    (!process.env.PUBSUB_SA_EMAIL || !process.env.PUBSUB_AUDIENCE_URL)) {
  console.error('[Server] FATAL: PUBSUB_SA_EMAIL and PUBSUB_AUDIENCE_URL must be set in production to verify billing webhooks. Exiting.');
  process.exit(1);
}

// Trust the first hop reverse-proxy (nginx / Railway / Cloudflare) so that
// express-rate-limit sees the real client IP from X-Forwarded-For rather than
// treating all requests as coming from the proxy's single IP.
app.set('trust proxy', 1);

// ── Security & performance middleware ─────────────────────────────────────────
app.use(helmet({
  // Allow the Vite dev proxy (cross-origin in development) to reach the API
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: false
}));
// Hard-cap request bodies to prevent DoS via oversized payloads
app.use(express.json({ limit: '10kb' }));

// ── Request correlation IDs ───────────────────────────────────────────────────
// Attach a short ID to each request so related log lines can be correlated.
app.use((req, _res, next) => { req.id = randomUUID().slice(0, 8); next(); });

// ── Pub/Sub billing webhook ───────────────────────────────────────────────────
// Mounted BEFORE the global rate-limiter and internal-token guard because
// Google Pub/Sub push subscriptions cannot inject custom headers.
// Request authenticity is verified inside handleBillingWebhook via OIDC token.
app.post('/api/billing/webhook', handleBillingWebhook);

// ── Global rate limit applied to every /api/* route ───────────────────────────
app.use('/api', globalLimiter);

// ── Shared-secret guard (transparent when INTERNAL_TOKEN is not configured) ───
// The Vite dev proxy injects X-Internal-Token automatically so the browser
// never sees the secret.  Skipped entirely when INTERNAL_TOKEN is not set.
app.use('/api', requireInternalToken);

// ── Route modules ─────────────────────────────────────────────────────────────
// server/routes/gemini.js    — LRU cache, in-flight dedup, per-endpoint rate limits
// server/routes/circulars.js — background scraper, file cache, circuit breaker
// server/routes/billing.js   — /verify route (webhook is mounted above)
// server/routes/usage.js     — server-side daily card-count enforcement
app.use('/api/gemini',    geminiRouter);
app.use('/api/circulars', circularsRouter);
app.use('/api/billing',   billingRouter);
app.use('/api/usage',     usageRouter);

// ── Liveness probe (no auth, no rate limit) ───────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ ok: true, uptime: Math.round(process.uptime()) })
);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// ── Centralised error handler ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start listening ───────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n[Server] CAIIB backend running on http://localhost:${PORT}`);
  console.log(`[Server] Gemini API key : ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ missing — add GEMINI_API_KEY to .env'}`);
  console.log(`[Server] CORS origin    : ${process.env.CORS_ORIGIN ?? 'http://localhost:5173'}`);
  console.log(`[Server] Auth token     : ${process.env.INTERNAL_TOKEN ? '✓ active' : '— disabled (dev mode)'}`);
  console.log(`[Server] Admin SDK      : ${adminDb ? '✓ connected' : '✗ disabled — set FIREBASE_SERVICE_ACCOUNT_JSON'}`);
  console.log(`[Server] Pub/Sub OIDC   : ${process.env.PUBSUB_SA_EMAIL ? '✓ configured' : '— skipped (set PUBSUB_SA_EMAIL + PUBSUB_AUDIENCE_URL for production)'}\n`);

  // Start the background RBI circular scraper (non-blocking fire-and-forget)
  startBackgroundScraper();
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n[Server] ${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] All connections drained. Goodbye.');
    process.exit(0);
  });
  // Force-exit after 10 s if connections don't drain in time
  setTimeout(() => {
    console.error('[Server] Forcing exit after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Crash safeguards ──────────────────────────────────────────────────────────
// Let the process exit on unhandled exceptions so the deployment platform
// (Railway, PM2, systemd) can restart it automatically.
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err.message, '\n', err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
  process.exit(1);
});
