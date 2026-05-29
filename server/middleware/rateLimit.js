import rateLimit from 'express-rate-limit';

/**
 * Global limiter — 100 requests per 15 minutes per IP.
 * Applied to all /api/* routes as a baseline safety net.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again later.' }
});

/**
 * Gemini AI limiter — 10 requests per hour per IP.
 * Tighter cap because each call consumes paid Gemini quota.
 */
export const geminiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait before submitting again (1-hour window).' }
});

/**
 * Circulars limiter — 20 requests per hour per IP.
 * Scraping the RBI site is lightweight but should still be capped.
 */
export const circularsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Circulars refresh limit reached. Live data auto-refreshes every 6 hours.' }
});
