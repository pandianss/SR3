import { Router }     from 'express';
import { createHash }  from 'crypto';
import axios           from 'axios';
import { geminiLimiter }      from '../middleware/rateLimit.js';
import { requireFirebaseAuth } from '../middleware/firebaseAuth.js';

const router = Router();

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─────────────────────────────────────────────────────────────────────────────
// LRU Cache with per-entry TTL — pure Map-based, zero extra dependencies.
// ─────────────────────────────────────────────────────────────────────────────
class LRUCache {
  constructor(maxSize = 200, defaultTtlMs = 24 * 60 * 60 * 1000) {
    this.maxSize      = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.map          = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.map.delete(key); return null; }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.maxSize) this.map.delete(this.map.keys().next().value);
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

const cache    = new LRUCache(200);
const inFlight = new Map();

function cacheKey(data) {
  return createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Strip control characters and cap length to neutralise prompt injection.
function sanitise(input, maxLen = 500) {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLen).replace(/[\x00-\x1F\x7F]/g, ' ');
}

async function dedupedGeminiCall(key, geminiBody, ttlMs) {
  const cached = cache.get(key);
  if (cached) { console.log(`[Gemini] Cache hit: ${key.slice(0, 8)}`); return cached; }

  if (inFlight.has(key)) {
    console.log(`[Gemini] Deduplicating in-flight request: ${key.slice(0, 8)}`);
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const res  = await axios.post(GEMINI_ENDPOINT, geminiBody, {
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        timeout: 25_000,
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
// Lightweight health check — no Gemini API call, requireFirebaseAuth.
// Reports whether the key is present; key validity is verified at server start.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', requireFirebaseAuth, (_req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.json({ status: 'missing', message: 'GEMINI_API_KEY is not set in the server environment.' });
  }
  return res.json({ status: 'active', message: 'Gemini API key is configured.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gemini/case-study
// Body: { topicName: string }
// Cached 24 h. Requires Firebase ID token once Admin SDK is configured.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/case-study', requireFirebaseAuth, geminiLimiter, async (req, res) => {
  const { topicName } = req.body ?? {};
  if (!topicName || typeof topicName !== 'string') {
    return res.status(400).json({ error: 'topicName (string) is required.' });
  }

  const safeTopic = sanitise(topicName);
  const prompt = `You are an expert tutor for the Indian CAIIB bank exam. Generate a realistic, challenging banking case study or calculation drill for the topic: "${safeTopic}".
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

  const key = cacheKey({ endpoint: 'case-study', topicName: safeTopic });

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
// Cached 6 h. Requires Firebase ID token once Admin SDK is configured.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/explain', requireFirebaseAuth, geminiLimiter, async (req, res) => {
  const { question, optionSelected, correctOption, whyDetail } = req.body ?? {};
  if (!question || !optionSelected || !correctOption) {
    return res.status(400).json({ error: 'question, optionSelected, and correctOption are required.' });
  }

  const safeQ       = sanitise(question);
  const safeOpt     = sanitise(optionSelected);
  const safeCorrect = sanitise(correctOption);
  const safeWhy     = sanitise(whyDetail ?? '');

  const prompt = `You are a supportive, fatigue-aware AI tutor for an exhausted banking professional studying for the CAIIB exam.
They were asked: "${safeQ}"
They selected the incorrect option: "${safeOpt}"
The correct option is: "${safeCorrect}"
Standard textbook reason: "${safeWhy || 'Not provided.'}"

Explain in 3 short, easy-to-read bullet points:
1. Why the selected option is incorrect.
2. The core conceptual rule or formula they missed.
3. A simple memory trick or shortcut to remember this on exam day under stress.

Keep the total explanation under 150 words. Do not use complex formatting.`;

  const key = cacheKey({ endpoint: 'explain', question: safeQ, optionSelected: safeOpt, correctOption: safeCorrect });

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
// Cached 30 min. Requires Firebase ID token once Admin SDK is configured.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/schedule', requireFirebaseAuth, geminiLimiter, async (req, res) => {
  const { projectedScores, elective } = req.body ?? {};
  if (!projectedScores || typeof projectedScores !== 'object') {
    return res.status(400).json({ error: 'projectedScores (object) is required.' });
  }

  const safeElective = sanitise(elective ?? '');
  const scoresStr    = Object.entries(projectedScores)
    .map(([s, v]) => `${sanitise(s, 20)}: ${Number(v) || 0}`)
    .join(', ');

  const prompt = `You are a strategic CAIIB exam coach.
The bank officer has these current projected marks: ${scoresStr} (elective: ${safeElective || 'General'}).
Write 2 sentences of highly tactical study advice.
Identify the single weakest paper, name the exact module or formula to focus on, and suggest how to redistribute daily study hours to maximise aggregate safety.
Be encouraging. Stay under 50 words.`;

  const key = cacheKey({ endpoint: 'schedule', projectedScores, elective: safeElective });

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
