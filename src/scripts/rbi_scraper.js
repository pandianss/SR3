// RBI Notifications Scraper & Ingestion Script
// Utilizes Axios for requests, Cheerio for DOM parsing, and Gemini API for LLM classification.

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// Load environment API key or standard stub
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const RBI_NOTIFICATIONS_URL = "https://rbi.org.in/Scripts/Notifications.aspx";

// Mapped topics for quick pattern matching
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

async function scrapeRBIPage() {
  console.log(`[Scraper] Fetching RBI Notifications Page: ${RBI_NOTIFICATIONS_URL}`);
  try {
    const response = await axios.get(RBI_NOTIFICATIONS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const $ = cheerio.load(response.data);
    const updates = [];

    // Select notification row containers
    // Note: RBI website typically nests rows under specific table classes depending on standard templates
    $("table.tablebg tr, table.table-responsive tr").each((index, element) => {
      // Skip table header
      if (index === 0) return;

      const dateText = $(element).find("td.griddate, td:nth-child(1)").text().trim();
      const titleLink = $(element).find("a[href*='Notification']");
      const titleText = titleLink.text().trim();
      const url = titleLink.attr("href");

      if (titleText && url) {
        // Resolve absolute URL
        const absoluteUrl = url.startsWith("http") ? url : `https://rbi.org.in/Scripts/${url}`;
        updates.push({
          date: dateText,
          title: titleText,
          url: absoluteUrl,
          id: parseNotificationId(titleText)
        });
      }
    });

    console.log(`[Scraper] Successfully extracted ${updates.length} raw notification nodes.`);
    return updates.slice(0, 5); // Process top 5 updates for validation/demonstration
  } catch (error) {
    console.error("[Scraper] Failed to fetch or parse RBI HTML DOM:", error.message);
    return [];
  }
}

// Extract standard RBI notification identifier, e.g. "RBI/2025-26/12"
function parseNotificationId(text) {
  const match = text.match(/RBI\/\d{4}-\d{2}\/\d+/i);
  return match ? match[0] : `RBI-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

async function classifyWithGemini(notification, apiKey) {
  if (!apiKey) {
    console.log(`[AI Pipeline] No API key detected. Running local rule-based topic matching for: ${notification.title}`);
    
    // Fallback: Perform local keyword search
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are a professional CAIIB exam coach. Classify the following RBI notification for bank students.
  
  Notification Title: "${notification.title}"
  URL Reference: "${notification.url}"
  Date: "${notification.date}"

  Provide a structured JSON output of exactly this schema:
  {
    "title": "A short, clear title capturing the essence of the update",
    "summary": "A concise, high-density summary explaining the changes, key targets, and compliance requirements in 3-4 bullet points (max 80 words)",
    "relevance": 95, // Integer 0-100 indicating importance for CAIIB exams. High risk weights/ratios get >85.
    "tag": "Subject name followed by specific module, e.g. BFM · Risk Management",
    "subjectId": "One of: ABM, BFM, ABFM, BRBL, IT, HR, Rural, Central",
    "topicId": "One of our database topic IDs. Choose: T-BFM-B1 (Basel), T-BFM-D1 (LCR), T-BFM-D3 (NSFR), T-ABM-C1 (Working Capital), T-ABM-C2 (NPAs), T-IT-C1 (Cyber), T-Rural-C1 (Priority Sector), T-Central-C1 (Monetary Policy). If not matching, use null."
  }
  Do not include markdown tags. Return raw JSON.`;

  try {
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

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
  const rawNotifications = await scrapeRBIPage();
  const processedDatabase = [];

  for (const notification of rawNotifications) {
    const processedItem = await classifyWithGemini(notification, GEMINI_API_KEY);
    if (processedItem) {
      processedDatabase.push(processedItem);
      console.log(`[Sync] Mapped Notification ${processedItem.id} -> Subject: ${processedItem.subjectId} | Topic: ${processedItem.topicId || "None"}`);
    }
  }

  // Save to temporary JSON file
  const outputPath = path.resolve("./src/data/newIngestedCirculars.json");
  fs.writeFileSync(outputPath, JSON.stringify(processedDatabase, null, 2), "utf8");
  console.log(`[Database] Ingestion complete. Output sync file created at: ${outputPath}`);
  console.log("=================================================");
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPipeline();
}

export { scrapeRBIPage, classifyWithGemini, runPipeline };
