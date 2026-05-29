/**
 * Optional shared-secret middleware.
 *
 * When INTERNAL_TOKEN is set in the environment, every /api request must
 * include a matching `X-Internal-Token` header.  The Vite dev proxy injects
 * this header automatically (see vite.config.js), so the browser never sees
 * or stores the token.  In production a reverse-proxy (nginx, etc.) does the
 * same injection.
 *
 * When INTERNAL_TOKEN is NOT set the check is skipped entirely — useful for
 * local-only development where rate limiting and CORS are sufficient.
 */
export function requireInternalToken(req, res, next) {
  const token = process.env.INTERNAL_TOKEN;
  // No token configured → open access (dev mode / intentionally public)
  if (!token) return next();

  const provided = req.headers['x-internal-token'];
  if (provided !== token) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid internal token.' });
  }
  next();
}
