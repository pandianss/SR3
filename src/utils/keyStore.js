/**
 * keyStore.js — Server-managed API key module.
 *
 * The Gemini API key now lives exclusively in the backend .env file and is
 * never transmitted to the browser.  This module provides a lightweight
 * status check against the backend so the UI can reflect whether AI features
 * are available.
 *
 * The legacy sessionStorage helpers are kept as no-ops so any stale import
 * paths don't crash — they simply have no effect.
 */

/**
 * Pings the backend status endpoint to determine whether the Gemini API key
 * is configured and reachable.
 *
 * @returns {Promise<'active'|'missing'|'error'|'offline'>}
 */
// __API_BASE__ is injected by Vite at build time:
//   '' in dev  (relative /api, handled by Vite proxy)
//   'https://api.superrecall.in' in production APK builds
const API_BASE = typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : '';

export async function checkServerApiStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/gemini/status`, {
      signal: AbortSignal.timeout(8_000)
    });
    if (!res.ok) return 'error';
    const data = await res.json();
    // Normalise legacy 'disconnected' to 'missing' in case of older server builds
    if (data.status === 'disconnected') return 'missing';
    return data.status ?? 'error'; // 'active' | 'missing' | 'error'
  } catch {
    return 'offline';
  }
}

// ── Deprecated stubs — retained for smooth migration ─────────────────────────

/** @deprecated API key is now server-managed. This is a no-op. */
export function getStoredApiKey() { return ''; }

/** @deprecated API key is now server-managed. This is a no-op. */
export function setStoredApiKey() {}
