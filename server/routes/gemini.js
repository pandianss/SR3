import { Router } from 'express';
import { createHash } from 'crypto';
import axios from 'axios';
import { geminiLimiter } from '../middleware/rateLimit.js';

const router = Router();

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─────────────────────────────────────────────────────────────────────────────
// LRU Cache with per-entry TTL — pure Map-based, zero extra dependencies.
// Map insertion order gives us natural LRU (oldest entry = first key).
// ─────────────────────────────────────────────────────────────────────────────
class LRUCache {
  constructor(maxSize = 200, defaultTtlMs = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    // Promote to MRU position
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.maxSize) {
      // Evict LRU (first inserted key)
      this.map.delete(this.map.keys().next().value);
    }
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  stats() {
    return { size: this.map.size, maxSize: this.maxSize };
  }
}

const cache = new LRUCache(200);

// ─────────────────────────────────────────────────────────────────────────────
// In-flight request deduplication.
// If two identical requests arrive before the first resolves, they share
// a single Promise — only one Gemini API call is made.
// ─────────────────────────────────────────────────────────────────────────────
const inFlight = new Map();

function cacheKey(data) {
  return createHash('md5').update(JSON.stringify(data)).digest('hex');
}

async function dedupedGeminiCall(key, geminiBody, ttlMs) {
  // 1. Serve from cache when available
  const cached = cache.get(key);
  if (cached) {
    console.log(`[Gemini] Cache hit: ${key.slice(0, 8)}`);
    return cached;
  }

  // 2. Return the existing Promise if this request is already in-flight
  if (inFlight.has(key)) {
    console.log(`[Gemini] Deduplicating in-flight request: ${key.slice(0, 8)}`);
    return inFlight.get(key);
  }

  // 3. Fire the Gemini call and register it as in-flight
  const promise = (async () => {
    try {
      const res = await axios.post(GEMINI_ENDPOINT, geminiBody, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        timeout: 25_000
      });
      const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) cache.set(key, text, ttlMs);
      return text;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/gemini/status
// Lightweight health check: is the API key present and Gemini reachable?
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', async (_req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.json({
      status: 'missing',
      message: 'GEMINI_API_KEY is not set in the server environment.'
    });
  }
  try {
    const probe = await axios.post(
      GEMINI_ENDPOINT,
      { contents: [{ parts: [{ text: 'ping' }] }] },
      {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        timeout: 8_000
      }
    );
    if (probe.status === 200) {
      return res.json({ status: 'active', message: 'Gemini API key is valid and responsive.' });
    }
    return res.json({ status: 'error', message: 'Gemini responded with an unexpected status.' });
  } catch (err) {
    const httpStatus = err.response?.status;
    if (httpStatus === 401 || httpStatus === 403) {
      return res.json({ status: 'error', message: 'Gemini API key is invalid or revoked.' });
    }
    return res.json({ status: 'error', message: 'Could not reach Gemini API. Check server connectivity.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gemini/case-study
// Body: { topicName: string }
// Cached 24 h — case study structure for a topic rarely needs regenerating.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/case-study', geminiLimiter, async (req, res) => {
  const { topicName } = req.body ?? {};
  if (!topicName || typeof topicName !== 'string') {
    return res.status(400).json({ error: 'topicName (string) is required.' });
  }

  const prompt = `You are an expert tutor for the Indian CAIIB bank exam. Generate a realistic, challenging banking case study or calculation drill for the topic: "${topicName}".
You must respond with a JSON object of exactly this structure:
{
  "title": "A concise title for the case study",
  "problem": "Detailed scenario parameters, e.g., given RWAs, assets, or finance numbers",
  "steps": [
    "Step 1 calculation showing formula and numbers",
    "Step 2 calculation showing formula and numbers",
    "Step 3 calculation showing final mathematical resolution"
  ],
  "verdict": "Final statutory compliance verdict or project appraisal result",
  "quiz": {
    "question": "A multiple choice question testing the user on the case scenario",
    "opts": ["Option A value", "Option B value", "Option C value", "Option D value"],
    "correct": 0,
    "why": "A brief explanation of why the correct option is right based on banking regulations"
  }
}
Return only raw JSON. Do not include markdown code block formatting.`;

  const key = cacheKey({ endpoint: 'case-study', topicName });

  try {
    const text = await dedupedGeminiCall(
      key,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } },
      24 * 60 * 60 * 1000
    );
    res.json(JSON.parse(text));
  } catch (err) {
    console.error('[Gemini] case-study error:', err.message);
    res.status(502).json({ error: 'Case study generation failed. Procedural fallback will be used.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gemini/explain
// Body: { question, optionSelected, correctOption, whyDetail }
// Cached 6 h — same wrong answer → same coaching advice.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/explain', geminiLimiter, async (req, res) => {
  const { question, optionSelected, correctOption, whyDetail } = req.body ?? {};
  if (!question || !optionSelected || !correctOption) {
    return res.status(400).json({ error: 'question, optionSelected, and correctOption are required.' });
  }

  const prompt = `You are a supportive, fatigue-aware AI tutor for an exhausted banking professional studying for the CAIIB exam.
They were asked: "${question}"
They selected the incorrect option: "${optionSelected}"
The correct option is: "${correctOption}"
Standard textbook reason: "${whyDetail || 'Not provided.'}"

Explain in 3 short, easy-to-read bullet points:
1. Why the selected option is incorrect.
2. The core conceptual rule or formula they missed.
3. A simple memory trick or shortcut to remember this on exam day under stress.

Keep the total explanation under 150 words. Do not use complex formatting.`;

  const key = cacheKey({ endpoint: 'explain', question, optionSelected, correctOption });

  try {
    const text = await dedupedGeminiCall(
      key,
      { contents: [{ parts: [{ text: prompt }] }] },
      6 * 60 * 60 * 1000
    );
    res.json({ explanation: text });
  } catch (err) {
    console.error('[Gemini] explain error:', err.message);
    res.status(502).json({ error: 'AI Coach explanation failed. Check connectivity.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gemini/schedule
// Body: { projectedScores: object, elective: string }
// Cached 30 min — scores change; don't reuse stale advice for too long.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/schedule', geminiLimiter, async (req, res) => {
  const { projectedScores, elective } = req.body ?? {};
  if (!projectedScores || typeof projectedScores !== 'object') {
    return res.status(400).json({ error: 'projectedScores (object) is required.' });
  }

  const scoresStr = Object.entries(projectedScores).map(([s, v]) => `${s}: ${v}`).join(', ');
  const prompt = `You are a strategic CAIIB exam coach.
The bank officer has these current projected marks: ${scoresStr} (elective: ${elective || 'General'}).
Write 2 sentences of highly tactical study advice.
Identify the single weakest paper, name the exact module or formula to focus on, and suggest how to redistribute daily study hours to maximise aggregate safety.
Be encouraging. Stay under 50 words.`;

  const key = cacheKey({ endpoint: 'schedule', projectedScores, elective });

  try {
    const text = await dedupedGeminiCall(
      key,
      { contents: [{ parts: [{ text: prompt }] }] },
      30 * 60 * 1000
    );
    res.json({ advisory: text });
  } catch (err) {
    console.error('[Gemini] schedule error:', err.message);
    res.status(502).json({ error: 'Strategy generation failed. Review projections manually.' });
  }
});

export default router;
