// AI Orchestrator & Client-Side Intelligence Simulator
// Implements procedural math generators, mistake trackers, and pass probability calculators.

import { SUBJECTS, FORMULAS } from "../data/contentGraph";
import { getAllCardStates } from "./spacedRepetition";

// 1. Procedural Numerical Problem Generator
// Randomizes values for core CAIIB formulas and generates custom step-by-step solutions and quizzes.
export function generateProceduralNumerical(topicId) {
  const seed = Math.random();
  
  if (topicId === "T-BFM-B1") {
    // Basel III Capital Adequacy
    const rwa = Math.floor(seed * 6 + 2) * 500; // ₹1,000 Cr to ₹4,000 Cr
    const cet1Pct = parseFloat((seed * 0.03 + 0.045).toFixed(3)); // 4.5% to 7.5%
    const addT1Pct = parseFloat((seed * 0.015 + 0.01).toFixed(3)); // 1.0% to 2.5%
    const t2Pct = parseFloat((seed * 0.02 + 0.01).toFixed(3)); // 1.0% to 3.0%
    
    const cet1 = Math.round(rwa * cet1Pct);
    const addT1 = Math.round(rwa * addT1Pct);
    const t1 = cet1 + addT1;
    const t2 = Math.round(rwa * t2Pct);
    const totalCap = t1 + t2;
    
    const cet1Ratio = parseFloat(((cet1 / rwa) * 100).toFixed(2));
    const t1Ratio = parseFloat(((t1 / rwa) * 100).toFixed(2));
    const crar = parseFloat(((totalCap / rwa) * 100).toFixed(2));
    
    // RBI Limits: CET1 >= 5.5%, Tier I >= 7.0%, Total CRAR >= 9.0%
    const cet1Ok = cet1Ratio >= 5.5;
    const t1Ok = t1Ratio >= 7.0;
    const crarOk = crar >= 9.0;
    const isCompliant = cet1Ok && t1Ok && crarOk;
    
    const questionVal = Math.random() > 0.5 ? "Total CRAR" : "Tier I Ratio";
    const answerVal = questionVal === "Total CRAR" ? crar : t1Ratio;
    
    // Create options with random shifts
    const correctValStr = `${answerVal}%`;
    const opts = [
      correctValStr,
      `${(answerVal - 1.2).toFixed(2)}%`,
      `${(answerVal + 1.5).toFixed(2)}%`,
      `${(answerVal * 0.85).toFixed(2)}%`
    ].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(correctValStr);
    
    return {
      title: "Basel III Capital Adequacy Simulation",
      problem: `Bank Alpha: RWA = ₹${rwa} Cr | CET1 Capital = ₹${cet1} Cr | Add. Tier I = ₹${addT1} Cr | Tier II Capital = ₹${t2} Cr.`,
      steps: [
        `Common Equity Tier 1 (CET1) Ratio = ${cet1} / ${rwa} × 100 = ${cet1Ratio}% (Required: ≥ 5.5%)`,
        `Total Tier 1 Capital = ${cet1} + ${addT1} = ₹${t1} Cr | Tier 1 Ratio = ${t1} / ${rwa} × 100 = ${t1Ratio}% (Required: ≥ 7.0%)`,
        `Total Capital = ${t1} + ${t2} = ₹${totalCap} Cr | CRAR = ${totalCap} / ${rwa} × 100 = ${crar}% (Required: ≥ 9.0%)`
      ],
      verdict: isCompliant 
        ? `✅ Basel Compliant (Total CRAR of ${crar}% exceeds the regulatory minimum of 9.0%).`
        : `❌ Non-Compliant (Calculated indices fail to meet all RBI statutory thresholds).`,
      quiz: {
        question: `Based on the parameters above, what is the bank's exact ${questionVal}?`,
        opts,
        correct: correctIdx,
        why: `The formula is: ${questionVal === "Total CRAR" ? "Total Capital / RWA × 100" : "Tier I Capital / RWA × 100"}. Solving gives: ${answerVal}%.`
      }
    };
  }
  
  if (topicId === "T-ABM-C1") {
    // Working Capital: Tandon MPBF Method II
    const ca = Math.floor(seed * 6 + 4) * 100; // 400 to 900 Lakhs
    const clExlBank = Math.floor(seed * 3 + 1.5) * 100; // 150 to 450 Lakhs
    
    const margin = Math.round(ca * 0.25);
    const mpbf = Math.round((ca * 0.75) - clExlBank);
    const nwc = Math.round(ca - clExlBank - Math.max(0, mpbf));
    
    const opts = [
      `₹${mpbf} Lakhs`,
      `₹${mpbf - 50} Lakhs`,
      `₹${Math.round(mpbf * 1.15)} Lakhs`,
      `₹${Math.round(ca * 0.75)} Lakhs`
    ].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(`₹${mpbf} Lakhs`);
    
    return {
      title: "MPBF Method II Working Capital",
      problem: `Borrower Assessment: Projected Current Assets (CA) = ₹${ca} Lakhs | Current Liabilities (CL) excluding Bank Borrowing = ₹${clExlBank} Lakhs.`,
      steps: [
        `Projected Current Assets (CA) = ₹${ca} Lakhs`,
        `Calculate Borrower Margin (25% of Current Assets) = 0.25 × ${ca} = ₹${margin} Lakhs`,
        `MPBF Method II = (0.75 × Current Assets) − CL (excl. bank finance)`,
        `MPBF = (0.75 × ${ca}) − ${clExlBank} = ${ca * 0.75} − ${clExlBank} = ₹${mpbf} Lakhs`
      ],
      verdict: mpbf > 0 
        ? `✅ Maximum Bank Finance allowed under Method II is ₹${mpbf} Lakhs. Borrower must bring in ₹${margin} Lakhs as margin (Net Working Capital).`
        : `❌ Negative Assessment (Borrower's current liabilities exceed available margin limits under Method II rules).`,
      quiz: {
        question: `Calculate the Maximum Permissible Bank Finance (MPBF) for this borrower using Tandon Committee Method II:`,
        opts,
        correct: correctIdx,
        why: `Under Method II, Margin required from long-term funds is 25% of Current Assets. Hence, MPBF = (0.75 * CA) - CL. Resolves to: ₹${mpbf} Lakhs.`
      }
    };
  }

  if (topicId === "T-ABFM-B1") {
    // CAPM Cost of Equity
    const rf = parseFloat((seed * 3 + 5.5).toFixed(1)); // 5.5% to 8.5%
    const rm = parseFloat((seed * 4 + 11.5).toFixed(1)); // 11.5% to 15.5%
    const beta = parseFloat((seed * 0.6 + 0.8).toFixed(2)); // 0.80 to 1.40
    
    const premium = parseFloat((rm - rf).toFixed(2));
    const ke = parseFloat((rf + beta * premium).toFixed(2));
    
    const opts = [
      `${ke}%`,
      `${(ke - 1.55).toFixed(2)}%`,
      `${(ke + 2.1).toFixed(2)}%`,
      `${(rf + premium).toFixed(2)}%`
    ].sort(() => Math.random() - 0.5);
    const correctIdx = opts.indexOf(`${ke}%`);
    
    return {
      title: "Cost of Equity (Ke) via CAPM",
      problem: `Project parameters: G-Sec Yield (Rf) = ${rf}% | Expected Return on Market Portfolio (Rm) = ${rm}% | Project Beta (β) = ${beta}.`,
      steps: [
        `Market Risk Premium (Rm − Rf) = ${rm}% − ${rf}% = ${premium}%`,
        `Equity Risk Premium = β × (Rm − Rf) = ${beta} × ${premium}% = ${(beta * premium).toFixed(2)}%`,
        `Cost of Equity (Ke) = Rf + Equity Risk Premium = ${rf}% + ${(beta * premium).toFixed(2)}% = ${ke}%`
      ],
      verdict: `✅ Hurdle rate Ke is established at ${ke}%. Future project cash flows should be discounted at this discount rate.`,
      quiz: {
        question: `Calculate the cost of equity (Ke) using the Capital Asset Pricing Model (CAPM) for this project:`,
        opts,
        correct: correctIdx,
        why: `Ke = Rf + β * (Rm - Rf). Plugging in: ${rf} + ${beta} * (${rm} - ${rf}) = ${ke}%.`
      }
    };
  }
  
  // Default fallback if topic doesn't support math
  return null;
}

// 2. Mistake Pattern & Weakness Analyzer
// Parses card history to extract specific conceptual errors.
export function analyzeMistakePatterns() {
  const states = getAllCardStates();
  const weaknesses = [];
  
  // Compile items with low scores or high failure counts
  Object.entries(states).forEach(([cardId, state]) => {
    const failures = state.history.filter(h => h.rating <= 2).length;
    
    if (failures >= 2 || (state.repetitions === 0 && state.lastReviewed !== null)) {
      // Find mapped formula or details
      const formula = FORMULAS.find(f => f.id === cardId);
      if (formula) {
        weaknesses.push({
          id: cardId,
          type: "Formula",
          name: formula.name,
          subject: formula.sub,
          failureCount: failures || 1,
          recommendation: `Revise formula details: ${formula.f}. Do 2 numerical practice drills.`
        });
      } else {
        // Assume it's a micro-lesson (prefixed with L-)
        weaknesses.push({
          id: cardId,
          type: "Concept",
          name: cardId.replace("L-", "") + " Concept Review",
          subject: cardId.includes("BFM") ? "BFM" : cardId.includes("ABM") ? "ABM" : "CAIIB",
          failureCount: failures || 1,
          recommendation: "Re-read Pillar disclosures and practice scenario calculations immediately."
        });
      }
    }
  });
  
  // If no organic weaknesses yet, seed some useful default suggestions
  if (weaknesses.length === 0) {
    weaknesses.push({
      id: "seed-w1",
      type: "Topic Risk",
      name: "Bond Yield & Duration Calculations",
      subject: "BFM",
      failureCount: 2,
      recommendation: "Highly weighted numerical domain. Review Macaulay vs Modified Duration relation."
    });
    weaknesses.push({
      id: "seed-w2",
      type: "Pillar Overlap",
      name: "Basel Pillar 2 Risk Assets (ICAAP)",
      subject: "BFM",
      failureCount: 1,
      recommendation: "Focus on supervisory audit rules and RBI domestic systemic thresholds."
    });
  }
  
  return weaknesses.slice(0, 3); // top 3 priorities
}

// 3. Dynamic Pass Probability & Projection Engine
// Combines syllabus coverage, card states, and target scores to compute exam pass probability.
export function calculatePassProbability(userProfile, studyHoursAdjustment = 0) {
  const states = getAllCardStates();
  
  // Base weights for subjects
  const defaultBaseScores = {
    ABM: 52,
    BFM: 48,
    ABFM: 45,
    BRBL: 50,
    Elective: 46
  };
  
  // Subject identifier for Elective
  const electiveId = userProfile?.elective || "Risk";
  
  // Calculate average mastery factor from reviews
  const subjectMasteries = { ABM: 0, BFM: 0, ABFM: 0, BRBL: 0, [electiveId]: 0 };
  const subjectCounts = { ABM: 0, BFM: 0, ABFM: 0, BRBL: 0, [electiveId]: 0 };
  
  Object.entries(states).forEach(([cardId, state]) => {
    // Determine subject
    let sub = "ABM";
    if (cardId.includes("BFM")) sub = "BFM";
    else if (cardId.includes("ABFM")) sub = "ABFM";
    else if (cardId.includes("BRBL")) sub = "BRBL";
    else if (cardId.includes("L-Risk") || cardId.includes("Risk")) sub = "Risk";
    
    // Treat active elective generic
    if (sub === "Risk" && electiveId !== "Risk") sub = electiveId;
    
    const strength = Math.min(100, (state.repetitions * 20) + (state.easeFactor * 10));
    subjectMasteries[sub] += strength;
    subjectCounts[sub]++;
  });
  
  // Calculate project marks based on base scores + mastery factor
  const projectedScores = {};
  let totalScoreSum = 0;
  let countSubjects = 5;
  
  const subjectsList = ["ABM", "BFM", "ABFM", "BRBL", electiveId];
  
  subjectsList.forEach(sub => {
    const base = defaultBaseScores[sub] || defaultBaseScores.Elective;
    const count = subjectCounts[sub] || 0;
    const avgM = count > 0 ? (subjectMasteries[sub] / count) : 40; // baseline 40% strength if unreviewed
    
    // Mastery yields up to +12 marks on baseline, forgetting decreases it by -8
    const reviewBonus = ((avgM - 50) / 50) * 10;
    
    // Add custom adjustments for specific weak/strong subjects declared by user during onboarding
    let onboardAdjust = 0;
    if (userProfile?.weakSubjects?.includes(sub)) onboardAdjust = -4;
    if (userProfile?.strongSubjects?.includes(sub)) onboardAdjust = +5;
    
    // Study allocation boost
    let hoursBoost = 0;
    if (studyHoursAdjustment > 0) {
      // Simulating study allocation (e.g. 10 hours yields +4 marks, scaled)
      hoursBoost = Math.min(8, studyHoursAdjustment * 1.5);
    }
    
    let finalProjected = Math.round(base + reviewBonus + onboardAdjust + hoursBoost);
    finalProjected = Math.max(30, Math.min(95, finalProjected)); // bound between 30 and 95
    
    projectedScores[sub] = finalProjected;
    totalScoreSum += finalProjected;
  });
  
  const averageAggregate = parseFloat((totalScoreSum / countSubjects).toFixed(1));
  
  // CAIIB Pass Criterion: 
  // 1. Min 50 in each subject OR 
  // 2. Min 45 in each subject with an overall aggregate of 50% in a single attempt.
  let hasFailScore = false; // below 45 is instant fail
  let hasMarginalScore = false; // between 45 and 49
  let subjectsBelow50 = [];
  
  subjectsList.forEach(sub => {
    const score = projectedScores[sub];
    if (score < 45) {
      hasFailScore = true;
      subjectsBelow50.push(sub);
    } else if (score < 50) {
      hasMarginalScore = true;
      subjectsBelow50.push(sub);
    }
  });
  
  let probability = 50; // start at 50%
  
  // Calculate probability dynamics
  if (hasFailScore) {
    // Immediate fail hazard
    probability = Math.round(Math.max(15, (averageAggregate - 40) * 3));
  } else if (hasMarginalScore && averageAggregate < 50) {
    // Failing on aggregate requirement
    probability = Math.round(Math.max(30, (averageAggregate - 45) * 8 + 30));
  } else {
    // Clearing both thresholds
    const margin = averageAggregate - 50;
    probability = Math.round(Math.min(99, 70 + (margin * 5)));
  }
  
  // Buffer adjustments for daily study plans
  const hoursTarget = parseFloat(userProfile?.studyHours || "2");
  if (hoursTarget >= 3) probability = Math.min(99, probability + 5);
  if (hoursTarget < 1.5) probability = Math.max(10, probability - 5);
  
  let statusText = "Failing";
  let statusColor = "#F87171"; // err
  if (probability >= 75) {
    statusText = "Safe Passage";
    statusColor = "#4ADE80"; // ok
  } else if (probability >= 50) {
    statusText = "Borderline Risk";
    statusColor = "#FB923C"; // warn
  }
  
  return {
    probability,
    statusText,
    statusColor,
    aggregate: averageAggregate,
    projectedScores,
    subjectsBelow50,
    electiveId
  };
}

// 4. Gemini API Integrations (Step 1 Roadmap)

export async function generateAICaseStudy(topicName, apiKey) {
  if (!apiKey) return null;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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
    "correct": 0, // 0-indexed index of correct option
    "why": "A brief explanation of why the correct option is right based on banking regulations"
  }
}
Return only raw JSON. Do not include markdown code block formatting (like \`\`\`json).`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!res.ok) throw new Error("Gemini API call failed");
    const data = await res.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Gemini case generation failed, falling back to local procedural:", e);
    return null;
  }
}

export async function explainMistake(question, optionSelected, correctOption, whyDetail, apiKey) {
  if (!apiKey) return "AI explanation requires an active Gemini API key. Double check settings.";
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are a supportive, fatigue-aware AI tutor for an exhausted banking professional studying for the CAIIB exam.
They were asked: "${question}"
They selected the incorrect option: "${optionSelected}"
The correct option is: "${correctOption}"
Standard textbook reason: "${whyDetail}"

Explain in 3 short, easy-to-read bullet points:
1. Why the selected option is incorrect.
2. The core conceptual rule or formula they missed.
3. A simple memory trick or shortcut to remember this on exam day under stress.

Keep the total explanation under 150 words. Do not use complex formatting.`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!res.ok) throw new Error("Gemini API call failed");
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to parse explanation.";
  } catch (e) {
    console.error("Gemini mistake explanation failed:", e);
    return "Error calling AI coach. Check your network or API key.";
  }
}

export async function generateStudySchedule(projectedScores, elective, apiKey) {
  if (!apiKey) {
    const lowSubjects = Object.entries(projectedScores)
      .filter(([_, score]) => score < 50)
      .map(([sub]) => sub);
    if (lowSubjects.length > 0) {
      return `Target priority: Focus heavily on ${lowSubjects.join(" and ")} where your projected marks are currently under the 50-mark safety threshold.`;
    }
    return "Study advisory: Keep reviewing formulas daily in the Revision Inbox to maintain your safe aggregate passing range.";
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const scoresStr = Object.entries(projectedScores).map(([sub, val]) => `${sub}: ${val}`).join(", ");
  const prompt = `You are a strategic CAIIB exam coach. 
The bank officer has these current projected marks: ${scoresStr} (with elective: ${elective}).
Write a 2-sentence highly tactical study advice. 
Identify the single weakest paper, tell them exactly what module/formula to focus on, and advise on redistributing daily study hours to maximize aggregate safety.
Keep it extremely encouraging and under 50 words.`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!res.ok) throw new Error("Gemini API call failed");
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Review weak subjects daily.";
  } catch (e) {
    console.error("Gemini schedule generation failed:", e);
    return "Review your low-projected subjects to secure your passing margin.";
  }
}
