import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import { QUESTION_BANK as QB_base } from '../src/data/questionBank.js';
import { MICRO_LESSONS, TOPICS, SUBJECTS } from '../src/data/contentGraph.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not found in .env');
  process.exit(1);
}

const cacheFilePath = './scripts/ai_questions_cache.json';
let cache = [];
if (fs.existsSync(cacheFilePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    console.log(`Loaded ${cache.length} cached generated questions from ${cacheFilePath}`);
  } catch (e) {
    console.warn('Warning: Could not parse cache file, starting fresh.');
  }
}

const subjects = ['ABM', 'BFM', 'BRBL', 'ABFM', 'Risk', 'IT', 'HR', 'Rural', 'Central'];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Query Gemini with retry logic
async function generateBatch(subjectId, batchNum, topics, existingCount) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const topicIds = topics.map(t => t.id);
  const topicNames = topics.map(t => t.name);

  const prompt = `You are a professional examiner for the Indian Institute of Banking & Finance (IIBF) preparing questions for the CAIIB (Certified Associate of Indian Institute of Bankers) exam.
Generate exactly 34 challenging, high-quality Multiple Choice Questions (MCQs) for the subject "${subjectId}".
These questions should specifically cover the following topics:
${topicNames.map((name, i) => `- ${topicIds[i]}: ${name}`).join('\n')}

Requirements:
1. Provide a mix of conceptual, numerical, and statutory regulatory questions matching standard IIBF guidelines.
2. Every mathematical calculation question must be 100% correct, use realistic figures, and have a detailed step-by-step breakdown in the explanation.
3. Each question must have exactly 4 options.
4. Respond ONLY with a JSON array matching this structure:
[
  {
    "subjectId": "${subjectId}",
    "topicId": "one of: ${topicIds.join(', ')}",
    "difficulty": "Easy" | "Medium" | "Hard",
    "q": "Question text here...",
    "opts": ["option A", "option B", "option C", "option D"],
    "correct": 1, // 0-based index of correct option
    "why": "Detailed explanation of why the option is correct, including step-by-step calculations."
  }
]`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  };

  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`Sending API request for ${subjectId} Batch ${batchNum} (focusing on ${topics.length} topics)...`);
      const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
      const rawText = response.data.candidates[0].content.parts[0].text;
      // Sanitize: strip all control chars except \n \r \t, then fix bare newlines inside JSON strings
      const sanitized = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Replace literal newlines/carriage returns inside JSON string values with \n escape
      const text = sanitized.replace(/"(?:[^"\\]|\\.)*"/gs, m =>
        m.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      );
      const questions = JSON.parse(text);
      if (Array.isArray(questions) && questions.length > 0) {
        console.log(`Successfully generated ${questions.length} questions for ${subjectId} Batch ${batchNum}.`);
        return questions;
      }
      throw new Error('API returned invalid JSON structure');
    } catch (e) {
      retries--;
      console.error(`Error on ${subjectId} Batch ${batchNum} (retries remaining: ${retries}):`, e.message);
      if (e.response) {
        console.error('Response details:', JSON.stringify(e.response.data));
      }
      if (retries > 0) {
        console.log('Sleeping 5 seconds before retrying...');
        await sleep(5000);
      }
    }
  }
  console.error(`Skipping ${subjectId} Batch ${batchNum} — all retries exhausted.`);
  return null;
}

console.log('=== STEP 1: GENERATE AI QUESTIONS ===\n');

for (const subjectId of subjects) {
  // Collect topics for this subject
  const subjectTopics = [];
  Object.entries(TOPICS).forEach(([modId, list]) => {
    if (modId.startsWith(subjectId + '-')) {
      list.forEach(t => subjectTopics.push(t));
    }
  });

  if (subjectTopics.length === 0) {
    console.warn(`Warning: No topics found for subject ${subjectId}`);
    continue;
  }

  // Split topics into first and second halves for the two batches
  const mid = Math.ceil(subjectTopics.length / 2);
  const topics1 = subjectTopics.slice(0, mid);
  const topics2 = subjectTopics.slice(mid);

  // Check Batch 1 in cache
  const hasBatch1 = cache.some(q => q.subjectId === subjectId && q.sourceBatch === 1);
  if (!hasBatch1) {
    console.log(`Generating Batch 1 for ${subjectId}...`);
    const q1 = await generateBatch(subjectId, 1, topics1, cache.length);
    if (q1) {
      q1.forEach(q => { q.sourceBatch = 1; cache.push(q); });
      fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
      await sleep(3000); // rate limiting sleep
    }
  } else {
    console.log(`Subject ${subjectId} Batch 1 is already cached.`);
  }

  // Check Batch 2 in cache
  const hasBatch2 = cache.some(q => q.subjectId === subjectId && q.sourceBatch === 2);
  if (!hasBatch2) {
    console.log(`Generating Batch 2 for ${subjectId}...`);
    const q2 = await generateBatch(subjectId, 2, topics2, cache.length);
    if (q2) {
      q2.forEach(q => { q.sourceBatch = 2; cache.push(q); });
      fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
      await sleep(3000); // rate limiting sleep
    }
  } else {
    console.log(`Subject ${subjectId} Batch 2 is already cached.`);
  }

  // Batch 3: target thin topics (< 5 questions in current bank)
  const hasBatch3 = cache.some(q => q.subjectId === subjectId && q.sourceBatch === 3);
  if (!hasBatch3) {
    // QB_base is already the merged bank (includes cache), so count only QB_base
    const currentCounts = {};
    QB_base.forEach(q => {
      if (q.subjectId === subjectId) currentCounts[q.topicId] = (currentCounts[q.topicId] || 0) + 1;
    });
    const thinTopics = subjectTopics.filter(t => (currentCounts[t.id] || 0) < 5);
    if (thinTopics.length > 0) {
      console.log(`Generating Batch 3 for ${subjectId} (${thinTopics.length} thin topics)...`);
      const q3 = await generateBatch(subjectId, 3, thinTopics, cache.length);
      if (q3) {
        q3.forEach(q => { q.sourceBatch = 3; cache.push(q); });
        fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
        await sleep(3000);
      }
    } else {
      console.log(`Subject ${subjectId} Batch 3 skipped — all topics already have ≥5 questions.`);
    }
  } else {
    console.log(`Subject ${subjectId} Batch 3 is already cached.`);
  }

  // Batch 4: target remaining thin topics (< 8 questions in current bank)
  const hasBatch4 = cache.some(q => q.subjectId === subjectId && q.sourceBatch === 4);
  if (!hasBatch4) {
    const currentCounts = {};
    QB_base.forEach(q => {
      if (q.subjectId === subjectId) currentCounts[q.topicId] = (currentCounts[q.topicId] || 0) + 1;
    });
    const thinTopics = subjectTopics.filter(t => (currentCounts[t.id] || 0) < 8);
    if (thinTopics.length > 0) {
      console.log(`Generating Batch 4 for ${subjectId} (${thinTopics.length} thin topics <8q)...`);
      const q4 = await generateBatch(subjectId, 4, thinTopics, cache.length);
      if (q4) {
        q4.forEach(q => { q.sourceBatch = 4; cache.push(q); });
        fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
        await sleep(3000);
      }
    } else {
      console.log(`Subject ${subjectId} Batch 4 skipped — all topics already have ≥8 questions.`);
    }
  } else {
    console.log(`Subject ${subjectId} Batch 4 is already cached.`);
  }

  // Batch 5: ABM only — target any remaining thin topics (< 10 questions)
  if (subjectId === 'ABM') {
    const hasBatch5 = cache.some(q => q.subjectId === subjectId && q.sourceBatch === 5);
    if (!hasBatch5) {
      const currentCounts = {};
      QB_base.forEach(q => {
        if (q.subjectId === subjectId) currentCounts[q.topicId] = (currentCounts[q.topicId] || 0) + 1;
      });
      const thinTopics = subjectTopics.filter(t => (currentCounts[t.id] || 0) < 10);
      if (thinTopics.length > 0) {
        console.log(`Generating Batch 5 for ${subjectId} (${thinTopics.length} thin topics <10q)...`);
        const q5 = await generateBatch(subjectId, 5, thinTopics, cache.length);
        if (q5) {
          q5.forEach(q => { q.sourceBatch = 5; cache.push(q); });
          fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
          await sleep(3000);
        }
      } else {
        console.log(`Subject ${subjectId} Batch 5 skipped — all topics already have ≥10 questions.`);
      }
    } else {
      console.log(`Subject ${subjectId} Batch 5 is already cached.`);
    }
  }
}

console.log(`\nTotal AI-generated questions ready in cache: ${cache.length}`);

console.log('\n=== STEP 2: EXTRACT LESSON QUIZZES ===');
const extractedLessonQuizzes = [];
MICRO_LESSONS.forEach(lesson => {
  const quizStep = lesson.steps?.find(s => s.kind === 'quiz');
  if (quizStep) {
    extractedLessonQuizzes.push({
      subjectId: lesson.subjectId,
      topicId: lesson.topicId,
      difficulty: 'Medium', // default to Medium for lesson concepts
      q: quizStep.question,
      opts: quizStep.opts,
      correct: quizStep.correct,
      why: quizStep.why
    });
  }
});
console.log(`Extracted ${extractedLessonQuizzes.length} quiz questions from lessons.`);

console.log('\n=== STEP 3: CONSOLIDATING AND RE-INDEXING ===');

const finalQuestions = [];

// Track indices for sequential IDs: Q-SUBJECT-001, 002...
const subjectIndices = {};
subjects.forEach(s => { subjectIndices[s] = 1; });

// Function to add questions to final array with sequential IDs
function addQuestionsToFinal(pool, sourceLabel) {
  pool.forEach(q => {
    const subj = q.subjectId;
    if (!subjectIndices[subj]) {
      subjectIndices[subj] = 1;
    }
    const idx = subjectIndices[subj];
    subjectIndices[subj] = idx + 1;
    const newId = `Q-${subj}-${String(idx).padStart(3, '0')}`;

    // Normalize difficulty
    let diff = q.difficulty;
    if (typeof diff === 'number') {
      diff = diff === 2 ? 'Hard' : diff === 1 ? 'Medium' : 'Easy';
    } else if (!diff || !['Easy', 'Medium', 'Hard'].includes(diff)) {
      diff = 'Medium';
    }

    finalQuestions.push({
      id: newId,
      subjectId: subj,
      topicId: q.topicId || 'Unknown',
      difficulty: diff,
      q: q.q || q.question,
      opts: q.opts,
      correct: q.correct,
      why: q.why
    });
  });
}

// 1. Add extracted lesson quizzes (canonical source — comes from contentGraph)
console.log(`Adding ${extractedLessonQuizzes.length} extracted lesson questions...`);
addQuestionsToFinal(extractedLessonQuizzes, 'Lesson');

// 2. Add AI generated questions (cache is the other canonical source)
console.log(`Adding ${cache.length} AI-generated questions...`);
addQuestionsToFinal(cache, 'AI');
// NOTE: QB_base (questionBank.js) is intentionally NOT re-added here — it is the
// OUTPUT of this pipeline, not a source. Adding it would compound duplicates on each run.

console.log(`Total questions in final pool: ${finalQuestions.length}`);

// Write final questionBank.js file
console.log('\nWriting final questionBank.js...');
let code = `// SuperRecall - CAIIB Question Bank
// Consolidated rapid-fire MCQ practice (core subjects + electives).
// Tagged by subject, topic ID, and difficulty.

export const QUESTION_BANK = [
`;

finalQuestions.forEach(q => {
  code += `  { id: ${JSON.stringify(q.id)}, subjectId: ${JSON.stringify(q.subjectId)}, topicId: ${JSON.stringify(q.topicId)}, difficulty: ${JSON.stringify(q.difficulty)},\n`;
  code += `    q: ${JSON.stringify(q.q)},\n`;
  code += `    opts: ${JSON.stringify(q.opts)}, correct: ${q.correct},\n`;
  code += `    why: ${JSON.stringify(q.why)} },\n\n`;
});

code += `];

// Helper — filter by subject
export function getQuestionsForSubject(subjectId, limit = null) {
  const qs = QUESTION_BANK.filter(q => q.subjectId === subjectId);
  if (limit) return qs.slice(0, limit);
  return qs;
}

// Helper — get a shuffled practice set
export function getPracticeSet(subjectId, count = 10) {
  const pool = getQuestionsForSubject(subjectId);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Helper — get by difficulty
export function getQuestionsbyDifficulty(subjectId, difficulty) {
  return QUESTION_BANK.filter(q => q.subjectId === subjectId && q.difficulty === difficulty);
}

// Helper — filter by topic
export function getQuestionsForTopic(topicId) {
  return QUESTION_BANK.filter(q => q.topicId === topicId);
}
`;

fs.writeFileSync('d:/sr3/src/data/questionBank.js', code, 'utf8');
console.log('Successfully wrote expanded questionBank.js to workspace!');
console.log('\n=== EXPANSION PIPELINE COMPLETE ===');
