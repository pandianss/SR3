// RBI Notifications RSS Scraper & Ingestion Script
// Node.js only — run via: node scripts/rbi_scraper.js
// Utilizes Axios for requests, Cheerio for XML parsing, and Gemini API for LLM classification.

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// Load environment API key — never hard-code credentials here.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const RBI_RSS_URL = "https://www.rbi.org.in/notifications_rss.xml";

// Mapped topics for quick pattern matching if Gemini is not active
const TOPIC_KEYWORD_MAP = [
  { keyword: "basel", topicId: "T-BFM-B1", subjectId: "BFM" },
  { keyword: "capital adequacy", topicId: "T-BFM-B1", subjectId: "BFM" },
  { keyword: "liquidity coverage", topicId: "T-BFM-D1", subjectId: "BFM" },
  { keyword: "lcr", topicId: "T-BFM-D1", subjectId: "BFM" },
  { keyword: "nsfr", topicId: "T-BFM-D3", subjectId: "BFM" },
  { keyword: "working capital", topicId: "T-ABM-C1", subjectId: "ABM" },
  { keyword: "mpbf", topicId: "T-ABM-C1", subjectId: "ABM" },
  { keyword: "npa", topicId: "T-ABM-C2", subjectId: "ABM" },
  { keyword: "non-performing", topicId: "T-ABM-C2", subjectId: "ABM" },
  { keyword: "cyber security", topicId: "T-IT-C1", subjectId: "IT" },
  { keyword: "incident", topicId: "T-IT-C1", subjectId: "IT" },
  { keyword: "priority sector", topicId: "T-Rural-C1", subjectId: "Rural" },
  { keyword: "monetary policy", topicId: "T-Central-C1", subjectId: "Central" }
];

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function scrapeRBIPage() {
  console.log(`[Scraper] Fetching RBI Notifications RSS Feed: ${RBI_RSS_URL}`);
  try {
    const response = await axios.get(RBI_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const updates = [];

    $("item").each((index, element) => {
      const titleText = $(element).find("title").text().trim();
      // In RSS 2.0, <link> may not expose text() reliably in xmlMode; fall back to html() or atom:link href
      const url = ($(element).find("link").text().trim()
        || $(element).find("link").html()?.trim()
        || $(element).find("link").attr("href")
        || "");
      const pubDate = $(element).find("pubDate").text().trim();
      const desc = $(element).find("description").text().trim();

      if (titleText && url) {
        // Parse date to readable format (e.g. "25 May 2026")
        let formattedDate = pubDate;
        try {
          const d = new Date(pubDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
          }
        } catch (e) {}

        // Extract ID
        let notificationId = `RBI-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const descMatch = desc.match(/RBI\/\d{4}-\d{2}\/\d+/i) || desc.match(/RBI\/[A-Z0-9\/-]+/i);
        if (descMatch) {
          notificationId = descMatch[0];
        } else {
          const titleMatch = titleText.match(/RBI\/\d{4}-\d{2}\/\d+/i) || titleText.match(/RBI\/[A-Z0-9\/-]+/i);
          if (titleMatch) {
            notificationId = titleMatch[0];
          }
        }

        updates.push({
          date: formattedDate,
          title: titleText,
          url,
          id: notificationId,
          descriptionRaw: desc
        });
      }
    });

    console.log(`[Scraper] Successfully extracted ${updates.length} raw notification nodes.`);
    return updates;
  } catch (error) {
    console.error("[Scraper] Failed to fetch or parse RBI RSS feed:", error.message);
    return [];
  }
}

async function classifyWithGemini(notification, apiKey) {
  if (!apiKey) {
    console.log(`[AI Pipeline] No API key detected. Running local rule-based topic matching for: ${notification.title}`);

    const lowerTitle = notification.title.toLowerCase();
    const match = TOPIC_KEYWORD_MAP.find(item => lowerTitle.includes(item.keyword)) || { topicId: null, subjectId: "BFM" };

    return {
      id: notification.id,
      date: notification.date,
      title: notification.title,
      summary: `Regulatory notification on: ${notification.title}. Verify official RBI document circular for detailed audit instructions.`,
      relevance: 85,
      tag: `${match.subjectId} · Ingested Update`,
      subjectId: match.subjectId,
      topicId: match.topicId
    };
  }

  const prompt = `You are a professional CAIIB exam coach. Classify the following RBI notification for bank students.

  Notification Title: "${notification.title}"
  URL Reference: "${notification.url}"
  Date: "${notification.date}"

  Provide a structured JSON output of exactly this schema:
  {
    "title": "A short, clear title capturing the essence of the update",
    "summary": "A concise, high-density summary explaining the changes, key targets, and compliance requirements in 3-4 bullet points (max 80 words)",
    "relevance": 95,
    "tag": "Subject name followed by specific module, e.g. BFM · Risk Management",
    "subjectId": "One of: ABM, BFM, ABFM, BRBL, IT, HR, Rural, Central",
    "topicId": "One of our database topic IDs. Choose: T-BFM-B1 (Basel), T-BFM-D1 (LCR), T-BFM-D3 (NSFR), T-ABM-C1 (Working Capital), T-ABM-C2 (NPAs), T-IT-C1 (Cyber), T-Rural-C1 (Priority Sector), T-Central-C1 (Monetary Policy). If not matching, use null."
  }
  Do not include markdown tags. Return raw JSON.`;

  try {
    const res = await axios.post(
      GEMINI_ENDPOINT,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      },
      { headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey } }
    );

    const jsonText = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
    const classified = JSON.parse(jsonText);

    return {
      id: notification.id,
      date: notification.date,
      ...classified
    };
  } catch (error) {
    console.error(`[AI Pipeline] Gemini API classification failed for ${notification.id}:`, error.message);
    return null;
  }
}

async function runPipeline() {
  console.log("=== Launching RBI Circular Ingestion Pipeline ===");
  const allNotifications = await scrapeRBIPage();
  const MAX_PER_RUN = parseInt(process.env.RBI_MAX_ITEMS || "20", 10);

  // Read existing DB — keep old records and their IDs for deduplication
  const outputPath = path.resolve("./src/data/ingestedCirculars.json");
  let existingRecords = [];
  let existingIds = new Set();
  try {
    existingRecords = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    existingIds = new Set(existingRecords.map(c => c.id));
  } catch (_) {}

  // Only process new items (not already in DB), capped after deduplication
  const rawNotifications = allNotifications
    .filter(n => !existingIds.has(n.id))
    .slice(0, MAX_PER_RUN);

  console.log(`[Pipeline] ${rawNotifications.length} new notifications to process (${existingIds.size} already in DB).`);
  const newlyProcessed = [];

  for (const notification of rawNotifications) {
    const processedItem = await classifyWithGemini(notification, GEMINI_API_KEY);
    if (processedItem) {
      newlyProcessed.push(processedItem);
      console.log(`[Sync] Mapped Notification ${processedItem.id} -> Subject: ${processedItem.subjectId} | Topic: ${processedItem.topicId || "None"}`);
    }
  }

  // Merge: new items first (most recent at top), then existing records
  const mergedDatabase = [...newlyProcessed, ...existingRecords];

  // Save merged DB to the JSON file
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(mergedDatabase, null, 2) + "\n", "utf8");
  console.log(`[Database] Ingestion complete. ${newlyProcessed.length} new + ${existingRecords.length} existing = ${mergedDatabase.length} total circulars written to: ${outputPath}`);
  console.log("=================================================");
}

// Run the script if executed directly (supporting cross-platform path comparisons)
const isDirectRun = process.argv[1] && (
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/rbi_scraper.js')
);

if (isDirectRun) {
  runPipeline();
}

export { scrapeRBIPage, classifyWithGemini, runPipeline };
