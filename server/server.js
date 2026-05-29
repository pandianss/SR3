import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { requireInternalToken } from './middleware/auth.js';
import { globalLimiter } from './middleware/rateLimit.js';
import geminiRouter from './routes/gemini.js';
import circularsRouter, { startBackgroundScraper } from './routes/circulars.js';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

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

// ── Global rate limit applied to every /api/* route ───────────────────────────
app.use('/api', globalLimiter);

// ── Shared-secret guard (transparent when INTERNAL_TOKEN is not configured) ───
// The Vite dev proxy injects X-Internal-Token automatically so the browser
// never sees the secret.  Skipped entirely when INTERNAL_TOKEN is not set.
app.use('/api', requireInternalToken);

// ── Route modules ─────────────────────────────────────────────────────────────
// server/routes/gemini.js   — LRU cache, in-flight dedup, per-endpoint rate limits
// server/routes/circulars.js — background scraper, file cache, force-refresh
app.use('/api/gemini',    geminiRouter);
app.use('/api/circulars', circularsRouter);

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
  console.log(`[Server] Auth token     : ${process.env.INTERNAL_TOKEN ? '✓ active' : '— disabled (dev mode)'}\n`);

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
