// AI Orchestrator & Client-Side Intelligence Simulator
// Implements procedural math generators, mistake trackers, and pass probability calculators.
// Gemini calls are now proxied through the secure backend — no API key ever reaches the browser.

import { SUBJECTS, FORMULAS } from "../data/contentGraph";
import { getAllCardStates } from "./spacedRepetition";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Procedural Numerical Problem Generator
// Randomises values for core CAIIB formulas and generates step-by-step drills.
// ─────────────────────────────────────────────────────────────────────────────
export function generateProceduralNumerical(topicId) {
  const seed = Math.random();

  if (topicId === "T-BFM-B1") {
    // Basel III Capital Adequacy
    const rwa        = Math.floor(seed * 6 + 2) * 500;
    const cet1Pct    = parseFloat((seed * 0.03 + 0.045).toFixed(3));
    const addT1Pct   = parseFloat((seed * 0.015 + 0.01).toFixed(3));
    const t2Pct      = parseFloat((seed * 0.02 + 0.01).toFixed(3));

    const cet1       = Math.round(rwa * cet1Pct);
    const addT1      = Math.round(rwa * addT1Pct);
    const t1         = cet1 + addT1;
    const t2         = Math.round(rwa * t2Pct);
    const totalCap   = t1 + t2;

    const cet1Ratio  = parseFloat(((cet1 / rwa) * 100).toFixed(2));
    const t1Ratio    = parseFloat(((t1   / rwa) * 100).toFixed(2));
    const crar       = parseFloat(((totalCap / rwa) * 100).toFixed(2));

    const cet1Ok     = cet1Ratio >= 5.5;
    const t1Ok       = t1Ratio   >= 7.0;
    const crarOk     = crar      >= 9.0;
    const isCompliant = cet1Ok && t1Ok && crarOk;

    const questionVal  = Math.random() > 0.5 ? "Total CRAR" : "Tier I Ratio";
    const answerVal    = questionVal === "Total CRAR" ? crar : t1Ratio;
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
    const ca       = Math.floor(seed * 6 + 4) * 100;
    const clExlBank = Math.floor(seed * 3 + 1.5) * 100;
    const margin   = Math.round(ca * 0.25);
    const mpbf     = Math.round((ca * 0.75) - clExlBank);

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
        ? `✅ Maximum Bank Finance allowed under Method II is ₹${mpbf} Lakhs. Borrower must bring ₹${margin} Lakhs as margin.`
        : `❌ Negative Assessment (Borrower's current liabilities exceed available margin limits under Method II rules).`,
      quiz: {
        question: `Calculate the Maximum Permissible Bank Finance (MPBF) for this borrower using Tandon Committee Method II:`,
        opts,
        correct: correctIdx,
        why: `Under Method II, margin required from long-term funds is 25% of Current Assets. Hence, MPBF = (0.75 * CA) - CL. Resolves to: ₹${mpbf} Lakhs.`
      }
    };
  }

  if (topicId === "T-ABFM-B1") {
    // CAPM Cost of Equity
    const rf      = parseFloat((seed * 3 + 5.5).toFixed(1));
    const rm      = parseFloat((seed * 4 + 11.5).toFixed(1));
    const beta    = parseFloat((seed * 0.6 + 0.8).toFixed(2));
    const premium = parseFloat((rm - rf).toFixed(2));
    const ke      = parseFloat((rf + beta * premium).toFixed(2));

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
      verdict: `✅ Hurdle rate Ke established at ${ke}%. Discount all future project cash flows at this rate.`,
      quiz: {
        question: `Calculate the cost of equity (Ke) using the Capital Asset Pricing Model (CAPM) for this project:`,
        opts,
        correct: correctIdx,
        why: `Ke = Rf + β * (Rm - Rf). Plugging in: ${rf} + ${beta} * (${rm} - ${rf}) = ${ke}%.`
      }
    };
  }

  return null; // topic doesn't support a procedural drill
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Mistake Pattern & Weakness Analyser
// Parses card history to surface specific conceptual errors.
// ─────────────────────────────────────────────────────────────────────────────
export function analyzeMistakePatterns() {
  const states     = getAllCardStates();
  const weaknesses = [];

  Object.entries(states).forEach(([cardId, state]) => {
    const failures = state.history.filter(h => h.rating <= 2).length;

    if (failures >= 2 || (state.repetitions === 0 && state.lastReviewed !== null)) {
      const formula = FORMULAS.find(f => f.id === cardId);
      if (formula) {
        weaknesses.push({
          id: cardId, type: "Formula", name: formula.name, subject: formula.sub,
          failureCount: failures || 1,
          recommendation: `Revise formula details: ${formula.f}. Do 2 numerical practice drills.`
        });
      } else {
        weaknesses.push({
          id: cardId, type: "Concept",
          name: cardId.replace("L-", "") + " Concept Review",
          subject: cardId.includes("BFM") ? "BFM" : cardId.includes("ABM") ? "ABM" : "CAIIB",
          failureCount: failures || 1,
          recommendation: "Re-read Pillar disclosures and practice scenario calculations immediately."
        });
      }
    }
  });

  if (weaknesses.length === 0) {
    weaknesses.push({
      id: "seed-w1", type: "Topic Risk",
      name: "Bond Yield & Duration Calculations", subject: "BFM", failureCount: 2,
      recommendation: "Highly weighted numerical domain. Review Macaulay vs Modified Duration relation."
    });
    weaknesses.push({
      id: "seed-w2", type: "Pillar Overlap",
      name: "Basel Pillar 2 Risk Assets (ICAAP)", subject: "BFM", failureCount: 1,
      recommendation: "Focus on supervisory audit rules and RBI domestic systemic thresholds."
    });
  }

  return weaknesses.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dynamic Pass Probability & Projection Engine
// ─────────────────────────────────────────────────────────────────────────────
export function calculatePassProbability(userProfile, studyHoursAdjustment = 0) {
  const states = getAllCardStates();

  const defaultBaseScores = { ABM: 52, BFM: 48, ABFM: 45, BRBL: 50, Elective: 46 };
  const electiveId        = userProfile?.elective || "Risk";

  const subjectMasteries = { ABM: 0, BFM: 0, ABFM: 0, BRBL: 0, [electiveId]: 0 };
  const subjectCounts    = { ABM: 0, BFM: 0, ABFM: 0, BRBL: 0, [electiveId]: 0 };

  Object.entries(states).forEach(([cardId, state]) => {
    let sub = "ABM";
    if (cardId.includes("BFM"))  sub = "BFM";
    else if (cardId.includes("ABFM")) sub = "ABFM";
    else if (cardId.includes("BRBL")) sub = "BRBL";
    else if (cardId.includes("L-Risk") || cardId.includes("Risk")) sub = "Risk";

    if (sub === "Risk" && electiveId !== "Risk") sub = electiveId;

    const strength = Math.min(100, (state.repetitions * 20) + (state.easeFactor * 10));
    subjectMasteries[sub] += strength;
    subjectCounts[sub]++;
  });

  const projectedScores  = {};
  let   totalScoreSum    = 0;
  const countSubjects    = 5;
  const subjectsList     = ["ABM", "BFM", "ABFM", "BRBL", electiveId];

  subjectsList.forEach(sub => {
    const base        = defaultBaseScores[sub] || defaultBaseScores.Elective;
    const count       = subjectCounts[sub] || 0;
    const avgM        = count > 0 ? (subjectMasteries[sub] / count) : 40;
    const reviewBonus = ((avgM - 50) / 50) * 10;

    let onboardAdjust = 0;
    if (userProfile?.weakSubjects?.includes(sub))   onboardAdjust = -4;
    if (userProfile?.strongSubjects?.includes(sub)) onboardAdjust = +5;

    const hoursBoost = studyHoursAdjustment > 0 ? Math.min(8, studyHoursAdjustment * 1.5) : 0;

    let finalProjected = Math.round(base + reviewBonus + onboardAdjust + hoursBoost);
    finalProjected     = Math.max(30, Math.min(95, finalProjected));

    projectedScores[sub] = finalProjected;
    totalScoreSum       += finalProjected;
  });

  const averageAggregate  = parseFloat((totalScoreSum / countSubjects).toFixed(1));
  let hasFailScore        = false;
  let hasMarginalScore    = false;
  const subjectsBelow50   = [];

  subjectsList.forEach(sub => {
    const score = projectedScores[sub];
    if (score < 45)      { hasFailScore     = true; subjectsBelow50.push(sub); }
    else if (score < 50) { hasMarginalScore = true; subjectsBelow50.push(sub); }
  });

  let probability = 50;
  if (hasFailScore) {
    probability = Math.round(Math.max(15, (averageAggregate - 40) * 3));
  } else if (hasMarginalScore && averageAggregate < 50) {
    probability = Math.round(Math.max(30, (averageAggregate - 45) * 8 + 30));
  } else {
    const margin = averageAggregate - 50;
    probability  = Math.round(Math.min(99, 70 + (margin * 5)));
  }

  const hoursTarget = parseFloat(userProfile?.studyHours || "2");
  if (hoursTarget >= 3)    probability = Math.min(99, probability + 5);
  if (hoursTarget <  1.5)  probability = Math.max(10, probability - 5);

  let statusText  = "Failing";
  let statusColor = "#F87171";
  if      (probability >= 75) { statusText = "Safe Passage";    statusColor = "#4ADE80"; }
  else if (probability >= 50) { statusText = "Borderline Risk"; statusColor = "#FB923C"; }

  return { probability, statusText, statusColor, aggregate: averageAggregate, projectedScores, subjectsBelow50, electiveId };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Gemini API integrations — routed through the secure backend.
//    No API key is ever sent from the browser.
// ─────────────────────────────────────────────────────────────────────────────

// In production APK builds, __API_BASE__ is the deployed backend URL.
// In dev, it is '' and the Vite proxy handles /api/* → localhost:3001.
const API_BASE = typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : '';

export async function generateAICaseStudy(topicName) {
  try {
    const res = await fetch(`${API_BASE}/api/gemini/case-study`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ topicName }),
      signal:  AbortSignal.timeout(25_000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('AI case study fetch error:', e);
    return null;
  }
}

export async function explainMistake(question, optionSelected, correctOption, whyDetail) {
  try {
    // Centralized Gemini requests are now proxied securely through our backend server.
    const res = await fetch(`${API_BASE}/api/gemini/explain`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question, optionSelected, correctOption, whyDetail }),
      signal:  AbortSignal.timeout(20_000)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error || 'AI explanation unavailable. Ensure the backend server is running.';
    }
    const data = await res.json();
    return data.explanation || 'Failed to parse explanation from server.';
  } catch (e) {
    console.error('Explain mistake error:', e);
    return 'Error calling AI coach. Ensure the backend server is running (npm run server).';
  }
}

export async function generateStudySchedule(projectedScores, elective) {
  // Always provide a local fallback so the UI is never empty
  const localFallback = () => {
    const lowSubjects = Object.entries(projectedScores)
      .filter(([, score]) => score < 50)
      .map(([sub]) => sub);
    return lowSubjects.length > 0
      ? `Target priority: Focus heavily on ${lowSubjects.join(' and ')} where projected marks are below the 50-mark safety threshold.`
      : 'Study advisory: Keep reviewing formulas daily in the Revision Inbox to maintain your safe aggregate passing range.';
  };

  try {
    const res = await fetch(`${API_BASE}/api/gemini/schedule`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ projectedScores, elective }),
      signal:  AbortSignal.timeout(20_000)
    });
    if (!res.ok) return localFallback();
    const data = await res.json();
    // Accept both 'advisory' (current) and 'schedule' (legacy field name)
    return data.advisory || data.schedule || localFallback();
  } catch (e) {
    console.error('Schedule generation error:', e);
    return localFallback();
  }
}
