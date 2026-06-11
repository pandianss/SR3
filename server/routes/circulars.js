import { Router } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { circularsLimiter } from '../middleware/rateLimit.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// CACHE_DIR defaults to /tmp so it's writable on containerised deployments
// (Railway, Render, Docker) where the source directory is read-only.
// Override with CACHE_DIR=/path/to/writable/dir if you have a persistent volume.
const CACHE_FILE         = join(process.env.CACHE_DIR ?? '/tmp', 'circulars.json');
const RBI_URL            = 'https://rbi.org.in/Scripts/Notifications.aspx';
const GEMINI_ENDPOINT    = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const REFRESH_INTERVAL   = 6 * 60 * 60 * 1000; // 6 hours in ms

// Local keyword → topic map used when Gemini is unavailable
const TOPIC_KEYWORD_MAP = [
  { keyword: 'basel',            topicId: 'T-BFM-B1',     subjectId: 'BFM'     },
  { keyword: 'capital adequacy', topicId: 'T-BFM-B1',     subjectId: 'BFM'     },
  { keyword: 'liquidity coverage', topicId: 'T-BFM-D1',   subjectId: 'BFM'     },
  { keyword: 'lcr',              topicId: 'T-BFM-D1',     subjectId: 'BFM'     },
  { keyword: 'nsfr',             topicId: 'T-BFM-D3',     subjectId: 'BFM'     },
  { keyword: 'working capital',  topicId: 'T-ABM-C1',     subjectId: 'ABM'     },
  { keyword: 'mpbf',             topicId: 'T-ABM-C1',     subjectId: 'ABM'     },
  { keyword: 'npa',              topicId: 'T-ABM-C2',     subjectId: 'ABM'     },
  { keyword: 'non-performing',   topicId: 'T-ABM-C2',     subjectId: 'ABM'     },
  { keyword: 'cyber security',   topicId: 'T-IT-C1',      subjectId: 'IT'      },
  { keyword: 'incident',         topicId: 'T-IT-C1',      subjectId: 'IT'      },
  { keyword: 'priority sector',  topicId: 'T-Rural-C1',   subjectId: 'Rural'   },
  { keyword: 'monetary policy',  topicId: 'T-Central-C1', subjectId: 'Central' }
];

// ── In-memory state ─────────────────────────────────────────────────────────
let memoryCache        = [];
let lastScrapedAt      = null;
let isScrapingNow      = false;
let consecutiveFailures = 0;                             // circuit-breaker counter
const MAX_BACKOFF_MS   = 24 * 60 * 60 * 1000;           // 24 h ceiling

// ── File-cache helpers ───────────────────────────────────────────────────────
function loadFileCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw    = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.data)) {
        memoryCache   = parsed.data;
        lastScrapedAt = parsed.scrapedAt ? new Date(parsed.scrapedAt) : null;
        console.log(`[Circulars] Loaded ${memoryCache.length} items from file cache.`);
      }
    }
  } catch (e) {
    console.warn('[Circulars] File cache read error (starting fresh):', e.message);
  }
}

function saveFileCache(data) {
  try {
    const dir = dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ scrapedAt: new Date().toISOString(), data }, null, 2),
      'utf8'
    );
  } catch (e) {
    console.error('[Circulars] Failed to write file cache:', e.message);
  }
}

// ── Scraper ──────────────────────────────────────────────────────────────────
function parseNotificationId(text) {
  const match = text.match(/RBI\/\d{4}-\d{2}\/\d+/i);
  return match ? match[0] : `RBI-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

async function scrapeRBIPage() {
  console.log('[Circulars] Fetching RBI notifications page...');
  const response = await axios.get(RBI_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 20_000
  });

  const $       = cheerio.load(response.data);
  const updates = [];

  $('table.tablebg tr, table.table-responsive tr').each((idx, el) => {
    if (idx === 0) return; // skip header row
    const dateText  = $(el).find('td.griddate, td:nth-child(1)').text().trim();
    const titleLink = $(el).find('a[href*="Notification"]');
    const titleText = titleLink.text().trim();
    const href      = titleLink.attr('href');

    if (titleText && href) {
      const absoluteUrl = href.startsWith('http') ? href : `https://rbi.org.in/Scripts/${href}`;
      updates.push({ date: dateText, title: titleText, url: absoluteUrl, id: parseNotificationId(titleText) });
    }
  });

  console.log(`[Circulars] Extracted ${updates.length} raw notifications.`);
  return updates.slice(0, 20);
}

async function classifyNotification(notification) {
  const apiKey     = process.env.GEMINI_API_KEY;
  const lowerTitle = notification.title.toLowerCase();

  // Local keyword fallback when no Gemini key is available
  if (!apiKey) {
    const match = TOPIC_KEYWORD_MAP.find(m => lowerTitle.includes(m.keyword)) ?? { topicId: null, subjectId: 'BFM' };
    return {
      id:        notification.id,
      date:      notification.date,
      title:     notification.title,
      summary:   `Regulatory notification: ${notification.title}. Review the official RBI circular for compliance details.`,
      relevance: 85,
      tag:       `${match.subjectId} · Ingested Update`,
      subjectId: match.subjectId,
      topicId:   match.topicId
    };
  }

  const prompt = `You are a professional CAIIB exam coach. Classify the following RBI notification for bank students.

Notification Title: "${notification.title}"
Date: "${notification.date}"

Provide a structured JSON output of exactly this schema:
{
  "title": "A short, clear title capturing the essence of the update",
  "summary": "A concise summary in 3-4 bullet points (max 80 words)",
  "relevance": 95,
  "tag": "Subject name followed by specific module, e.g. BFM · Risk Management",
  "subjectId": "One of: ABM, BFM, ABFM, BRBL, IT, HR, Rural, Central",
  "topicId": "One of: T-BFM-B1 (Basel), T-BFM-D1 (LCR), T-BFM-D3 (NSFR), T-ABM-C1 (Working Capital), T-ABM-C2 (NPAs), T-IT-C1 (Cyber), T-Rural-C1 (Priority Sector), T-Central-C1 (Monetary Policy). Use null if none match."
}
Return raw JSON only. No markdown.`;

  try {
    const res      = await axios.post(
      GEMINI_ENDPOINT,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, timeout: 20_000 }
    );
    const jsonText = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    const classified = JSON.parse(jsonText);
    return { id: notification.id, date: notification.date, ...classified };
  } catch (err) {
    console.error(`[Circulars] Gemini classification failed for ${notification.id}:`, err.message);
    return null;
  }
}

// ── Pipeline ─────────────────────────────────────────────────────────────────
async function runPipeline() {
  if (isScrapingNow) {
    console.log('[Circulars] Scrape already in progress — skipping duplicate trigger.');
    return memoryCache;
  }

  isScrapingNow = true;
  console.log('[Circulars] === Starting scrape pipeline ===');

  try {
    const raw     = await scrapeRBIPage();
    const results = [];

    for (const notification of raw) {
      const item = await classifyNotification(notification);
      if (item) {
        results.push(item);
        console.log(`[Circulars] ✓ ${item.id} → ${item.subjectId}`);
      }
    }

    if (results.length > 0) {
      memoryCache         = results;
      lastScrapedAt       = new Date();
      consecutiveFailures = 0; // reset circuit breaker on successful scrape
      saveFileCache(results);
      console.log(`[Circulars] Pipeline complete — ${results.length} circulars cached.`);
    } else {
      console.warn('[Circulars] Pipeline returned 0 results — retaining previous cache.');
      consecutiveFailures = 0; // partial success (RBI reachable); don't back off
    }
  } catch (err) {
    consecutiveFailures++;
    console.error(`[Circulars] Pipeline error (failure #${consecutiveFailures}):`, err.message);
  } finally {
    isScrapingNow = false;
  }

  return memoryCache;
}

// ── Background scheduler with circuit breaker ─────────────────────────────────
// Uses recursive setTimeout + exponential backoff instead of setInterval so
// that repeated failures (e.g. RBI site down) back off rather than hammering
// the external endpoint every 6 hours regardless.
//
// Backoff schedule (base = 6 h):
//   0 failures  → 6 h
//   1 failure   → 6 h
//   2 failures  → 12 h
//   3 failures  → 24 h  (ceiling)
//   …
async function scrapeLoop() {
  await runPipeline(); // errors are caught and counted inside runPipeline

  const backoffMs = consecutiveFailures <= 1
    ? REFRESH_INTERVAL
    : Math.min(MAX_BACKOFF_MS, REFRESH_INTERVAL * Math.pow(2, consecutiveFailures - 1));

  if (consecutiveFailures > 1) {
    const mins = Math.round(backoffMs / 60_000);
    console.log(`[Circulars] Circuit-breaker: ${consecutiveFailures} consecutive failure(s) — next attempt in ${mins} min.`);
  }

  setTimeout(scrapeLoop, backoffMs);
}

// Called once from server.js on startup — non-blocking (no top-level await).
export function startBackgroundScraper() {
  loadFileCache(); // hydrate memory cache from persisted file immediately
  scrapeLoop();    // runs immediately, then self-schedules
  console.log('[Circulars] Background scraper initialised. Base refresh interval: 6 hours.');
}

// ── Route: GET /api/circulars ─────────────────────────────────────────────────
router.get('/', circularsLimiter, async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';

  if (forceRefresh) {
    // Guard: each force-refresh fires up to 20 Gemini classification calls.
    // Require REFRESH_SECRET header when the env var is configured; in dev
    // (no REFRESH_SECRET set) the check is skipped to allow easy testing.
    const secret = process.env.REFRESH_SECRET;
    if (secret && req.headers['x-refresh-secret'] !== secret) {
      return res.status(403).json({ error: 'Force-refresh requires admin authorisation.' });
    }

    // Throttle: skip re-scrape if cache is less than 30 minutes old.
    const cacheAgeMs  = lastScrapedAt ? Date.now() - lastScrapedAt.getTime() : Infinity;
    const MIN_AGE_MS  = 30 * 60 * 1000;
    if (cacheAgeMs < MIN_AGE_MS) {
      console.log(`[Circulars] Force-refresh skipped — cache is only ${Math.round(cacheAgeMs / 60000)} min old.`);
    } else {
      console.log('[Circulars] Force-refresh authorised.');
      await runPipeline();
    }
  } else if (memoryCache.length === 0) {
    // Cache cold on first hit before background scraper finishes — block briefly.
    console.log('[Circulars] Cache empty on first request — running synchronous scrape...');
    await runPipeline();
  }

  res
    .set('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    .json({
      data: memoryCache,
      meta: {
        count:       memoryCache.length,
        scrapedAt:   lastScrapedAt?.toISOString() ?? null,
        isRefreshing: isScrapingNow
      }
    });
});

export default router;
