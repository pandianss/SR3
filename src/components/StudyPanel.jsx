import { useState, useEffect, useRef } from "react";
import { updateCardProgress } from "../utils/spacedRepetition";
import { generateProceduralNumerical, generateAICaseStudy, explainMistake } from "../utils/aiOrchestrator";
import AudioPlayer from "./AudioPlayer";
import NumericalCalculator from "./NumericalCalculator";
import { Clock, Calculator, Edit3, CheckCircle, AlertTriangle, Zap, Volume2, Sparkles, BookOpen } from "lucide-react";
import { C } from "../theme";

export default function StudyPanel({ sessionQueue, onSessionComplete, energyMode, setTab }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0); // 0: Concept, 1: Pillars, 2: Scenario, 3: Quiz, 4: Rating
  const [pickedOpt, setPickedOpt] = useState(null);

  // Numerical Drill variables
  const [proceduralMath, setProceduralMath] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [scratchpad, setScratchpad] = useState("");
  const [showScratchpad, setShowScratchpad] = useState(false);

  // Timer for Deep Focus — managed via ref to guarantee a single active interval.
  const timerRef = useRef(null);
  const [timerCount, setTimerCount] = useState(90);

  // Dynamic Gemini states (Step 1 Roadmap)
  const [aiCaseLoading, setAiCaseLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);

  const item = sessionQueue[currentIndex];

  // Reset state and restart timer when card or mode changes.
  useEffect(() => {
    setCurrentSubStep(0);
    setPickedOpt(null);
    setScratchpad("");
    setShowCalculator(false);
    setShowScratchpad(false);
    setAiExplanation("");
    setShowExplainModal(false);

    // Always clear any existing interval before potentially starting a new one.
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (item) {
      if (energyMode === "focus") {
        setTimerCount(90);
        timerRef.current = setInterval(() => {
          setTimerCount(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      const loadCaseData = async () => {
        setAiCaseLoading(true);
        try {
          // Always try the backend first; returns null on any failure
          const aiCase = await generateAICaseStudy(item.title);
          if (aiCase) {
            setProceduralMath(aiCase);
            setAiCaseLoading(false);
            return;
          }
        } catch (e) {
          console.error("AI case study fetch error, using procedural fallback", e);
        }

        // Fallback to local procedural randomised math
        const math = generateProceduralNumerical(item.topicId);
        setProceduralMath(math);
        setAiCaseLoading(false);
      };

      loadCaseData();
    }

    // Cleanup interval on unmount or before next effect run.
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, item, energyMode]);

  const handleAskAICoach = async () => {
    setLoadingExplanation(true);
    setShowExplainModal(true);
    try {
      const responseText = await explainMistake(
        quizStep.question,
        quizStep.opts[pickedOpt],
        quizStep.opts[quizStep.correct],
        quizStep.why
      );
      setAiExplanation(responseText);
    } catch (e) {
      setAiExplanation("AI Coach encountered an issue explaining this mistake. Check your connectivity.");
    }
    setLoadingExplanation(false);
  };

  if (!item) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: C.muted }}>No study items loaded.</p>
        <button onClick={() => setTab("home")} style={{ background: C.accent, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
          Go Home
        </button>
      </div>
    );
  }

  // Retrieve data structures safely (whether procedural or static)
  const conceptStep = item.steps?.[0] || { title: item.name, body: "Revision Unit", highlight: item.note || "" };
  const pillarsStep = item.steps?.[1] || { title: "Key Parameters", pillars: [{ e: "🔑", n: "Note", d: item.note || "" }] };
  const scenarioStep = proceduralMath || item.steps?.[2] || { title: "Numerical Scenario", problem: item.f || "No details available.", steps: [], verdict: "Verify formula values." };
  const quizStep = proceduralMath?.quiz || item.steps?.[3] || { question: `Write down formula: ${item.name}`, opts: ["Known", "Review Needed"], correct: 0, why: item.note || "" };

  const handleNextSubStep = () => {
    if (energyMode === "low") {
      // Low Energy skips calculation scenarios & quizzes — just Concept, Pillars, then rate
      if (currentSubStep === 0) {
        setCurrentSubStep(1);
      } else if (currentSubStep === 1) {
        setCurrentSubStep(4);
      }
    } else {
      if (currentSubStep < 4) {
        setCurrentSubStep(currentSubStep + 1);
      }
    }
  };

  const handleBackSubStep = () => {
    if (energyMode === "low") {
      if (currentSubStep === 4) {
        setCurrentSubStep(1);
      } else if (currentSubStep === 1) {
        setCurrentSubStep(0);
      }
    } else {
      if (currentSubStep > 0) {
        setCurrentSubStep(currentSubStep - 1);
      }
    }
  };

  const handleRate = (rating) => {
    // Write SM-2 updates to LocalStorage
    updateCardProgress(item.id, rating);

    // Proceed to next card in session
    if (currentIndex < sessionQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSessionComplete();
    }
  };

  const isCorrect = pickedOpt === quizStep.correct;

  // Prepare clean text for TTS voice playback
  const getSpeechText = () => {
    if (currentSubStep === 0) return conceptStep.body;
    if (currentSubStep === 1) return pillarsStep.pillars?.map(p => `${p.n}: ${p.d}`).join(". ") || "";
    return "";
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "16px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, position: "relative" }}>
        <button onClick={() => setTab("home")}
          style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            width: 36, height: 36, cursor: "pointer", color: C.muted, fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {sessionQueue.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: i <= currentIndex ? C.blue : C.border,
                transition: "background 0.3s"
              }} />
            ))}
          </div>
          <p style={{ color: C.muted, fontSize: 11, margin: "5px 0 0" }}>
            Card {currentIndex + 1} of {sessionQueue.length}
          </p>
        </div>

        {/* Deep Focus Controls */}
        {energyMode === "focus" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowCalculator(!showCalculator)}
              style={{
                width: 32, height: 32, borderRadius: 8, background: showCalculator ? C.accent : C.card,
                border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                color: showCalculator ? "#000" : C.muted, cursor: "pointer"
              }}>
              <Calculator size={15} />
            </button>
            <button onClick={() => setShowScratchpad(!showScratchpad)}
              style={{
                width: 32, height: 32, borderRadius: 8, background: showScratchpad ? C.blue : C.card,
                border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                color: showScratchpad ? "#000" : C.muted, cursor: "pointer"
              }}>
              <Edit3 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Floating Calculator Overlay */}
      {showCalculator && (
        <div style={{ position: "absolute", zIndex: 100, top: 60, right: 20 }}>
          <NumericalCalculator onClose={() => setShowCalculator(false)} />
        </div>
      )}

      {/* Exam Countdown Timer — visible while countdown is running */}
      {energyMode === "focus" && timerCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, background: timerCount < 20 ? `${C.err}22` : `${C.warn}22`,
          border: `1px solid ${timerCount < 20 ? C.err : C.warn}`, borderRadius: 8,
          padding: "6px 12px", marginBottom: 12, justifyContent: "center"
        }}>
          <Clock size={14} color={timerCount < 20 ? C.err : C.warn} />
          <span style={{ fontSize: 12, fontWeight: 700, color: timerCount < 20 ? C.err : C.warn, fontFamily: "monospace" }}>
            Exam Drill Timer: {timerCount}s
          </span>
        </div>
      )}

      {/* Main card box */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {aiCaseLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, minHeight: 250 }}>
            <div className="spin-animate" style={{
              border: `3px solid ${C.border}`, borderTop: `3px solid ${C.teal}`,
              borderRadius: "50%", width: 28, height: 28
            }} />
            <p style={{ color: C.muted, fontSize: 12 }}>✨ Ingesting AI Case Study via Gemini...</p>
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
              .spin-animate { animation: spin 0.8s linear infinite; }
            `}</style>
          </div>
        ) : (
          <>
            {/* Floating scratchpad textarea */}
            {showScratchpad && (
              <div style={{ background: C.cardAlt, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Quick Scratchpad (Zero typing allowed in exam, use for notes)</span>
                <textarea placeholder="Write scratch calculations here..." rows="3" value={scratchpad}
                  onChange={(e) => setScratchpad(e.target.value)}
                  style={{ width: "100%", background: "#050B14", border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: "monospace", padding: 8, marginTop: 4, outline: "none", resize: "none" }} />
              </div>
            )}

            {/* CONCEPT STEP */}
            {currentSubStep === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: `${C.blue}22`, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.blue}44` }}>
                    {item.subjectId || item.sub} · Concept
                  </span>
                  <span style={{ color: C.muted, fontSize: 11 }}>Step 1 of {energyMode === "low" ? "3" : "5"}</span>
                </div>
                <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{conceptStep.title}</h2>

                <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                  <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{conceptStep.body}</p>
                </div>

                {conceptStep.highlight && (
                  <div style={{ background: `${C.accent}12`, border: `1px solid ${C.accent}44`, borderRadius: 12, padding: 14 }}>
                    <span style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Equation Reference</span>
                    <p style={{ color: C.accentL, fontSize: 13, fontFamily: "monospace", margin: "4px 0 0", fontWeight: 700 }}>{conceptStep.highlight}</p>
                  </div>
                )}

                {/* Simulated Audio Mode for Low Energy/Commuting */}
                {energyMode === "low" && (
                  <AudioPlayer textToRead={getSpeechText()} title={conceptStep.title} />
                )}
              </div>
            )}

            {/* PILLARS STEP */}
            {currentSubStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.purple, background: `${C.purple}22`, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.purple}44` }}>
                    {item.subjectId || item.sub} · Framework
                  </span>
                  <span style={{ color: C.muted, fontSize: 11 }}>Step 2 of {energyMode === "low" ? "3" : "5"}</span>
                </div>
                <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{pillarsStep.title}</h2>

                {pillarsStep.pillars?.map((p, idx) => (
                  <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }}>{p.e}</span>
                    <div>
                      <p style={{ color: C.purple, fontWeight: 700, fontSize: 12, margin: "0 0 2px" }}>{p.n}</p>
                      <p style={{ color: C.text, fontSize: 12, lineHeight: 1.45, margin: 0 }}>{p.d}</p>
                    </div>
                  </div>
                ))}

                {energyMode === "low" && (
                  <AudioPlayer textToRead={getSpeechText()} title={pillarsStep.title} />
                )}
              </div>
            )}

            {/* SCENARIO STEP */}
            {currentSubStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.teal, background: `${C.teal}22`, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.teal}44` }}>
                    Numerical Assessment
                  </span>
                  <span style={{ color: C.muted, fontSize: 11 }}>Step 3 of 5</span>
                </div>
                <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{scenarioStep.title}</h2>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                  <span style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>GIVEN VALUES</span>
                  <p style={{ color: C.accentL, fontSize: 13, fontFamily: "monospace", margin: "4px 0 0", lineHeight: 1.5 }}>
                    {scenarioStep.problem}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {scenarioStep.steps?.map((s, idx) => (
                    <div key={idx} style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8 }}>
                      <span style={{ color: C.teal, fontWeight: 700, fontSize: 11, fontFamily: "monospace" }}>{idx + 1}</span>
                      <span style={{ color: C.text, fontSize: 12, fontFamily: "monospace" }}>{s}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: `${C.ok}12`, border: `1px solid ${C.ok}33`, borderRadius: 10, padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <CheckCircle size={15} color={C.ok} style={{ flexShrink: 0 }} />
                  <p style={{ color: C.ok, fontSize: 12, fontWeight: 600, margin: 0 }}>{scenarioStep.verdict}</p>
                </div>
              </div>
            )}

            {/* QUIZ STEP */}
            {currentSubStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: `${C.accent}22`, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.accent}44` }}>
                    Quick Check
                  </span>
                  <span style={{ color: C.muted, fontSize: 11 }}>Step 4 of 5</span>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.45 }}>
                    {quizStep.question}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {quizStep.opts?.map((opt, idx) => {
                    const isSelected = pickedOpt === idx;
                    const isCorrectOpt = idx === quizStep.correct;
                    let bg = C.card, border = C.border, col = C.text;
                    if (pickedOpt !== null) {
                      if (isCorrectOpt) { bg = `${C.ok}18`; border = C.ok; col = C.ok; }
                      else if (isSelected) { bg = `${C.err}18`; border = C.err; col = C.err; }
                    }
                    return (
                      <button key={idx} disabled={pickedOpt !== null} onClick={() => setPickedOpt(idx)}
                        style={{
                          background: bg, border: `1.5px solid ${border}`, borderRadius: 10,
                          padding: "10px 14px", cursor: pickedOpt === null ? "pointer" : "default",
                          display: "flex", alignItems: "center", gap: 10, textAlign: "left", width: "100%"
                        }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%", background: `${col}18`, border: `1px solid ${col}`,
                          fontSize: 10, fontWeight: 700, color: col, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span style={{ color: col, fontSize: 12 }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {pickedOpt !== null && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: isCorrect ? `${C.ok}10` : `${C.err}10`, border: `1px solid ${isCorrect ? C.ok : C.err}33`, borderRadius: 10, padding: 12 }}>
                      <p style={{ color: isCorrect ? C.ok : C.err, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>
                        {isCorrect ? "✅ Correct" : "❌ Incorrect"}
                      </p>
                      <p style={{ color: C.text, fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                        {quizStep.why}
                      </p>
                    </div>

                    {!isCorrect && (
                      <button onClick={handleAskAICoach} disabled={loadingExplanation}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, background: `${C.accent}18`,
                          border: `1px solid ${C.accent}44`, borderRadius: 8, padding: "6px 12px", width: "fit-content",
                          color: C.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                        }}>
                        <span>✨ {loadingExplanation ? "AI Coach Thinking..." : "Ask AI Coach"}</span>
                      </button>
                    )}

                    {showExplainModal && (
                      <div style={{
                        background: C.cardAlt, border: `1.5px solid ${C.accent}44`,
                        borderRadius: 10, padding: 12, position: "relative"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>✨ AI Coach Diagnosis</span>
                          <button onClick={() => setShowExplainModal(false)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 9 }}>
                            Close
                          </button>
                        </div>
                        <p style={{ color: C.text, fontSize: 11.5, lineHeight: 1.5, whiteSpace: "pre-line", margin: 0 }}>
                          {loadingExplanation ? "Running incorrect pattern analysis..." : aiExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CONFIDENCE RATING STEP */}
            {currentSubStep === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", justifyContent: "center", textAlign: "center", padding: "10px 0" }}>
                <div>
                  <Sparkles size={36} color={C.accent} style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Assessment Complete</h3>
                  <p style={{ color: C.muted, fontSize: 13, marginTop: 4, padding: "0 20px" }}>
                    How easily did you recall this regulatory concept? This calibrates your SuperMemo SM-2 spaced repetition queue.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 280, margin: "0 auto", width: "100%" }}>
                  {[
                    { r: 1, label: "Forgot (Review tomorrow)", color: C.err, bg: "#EF444420" },
                    { r: 2, label: "Struggled (Short interval)", color: C.warn, bg: "#F59E0B20" },
                    { r: 3, label: "Recalled (Normal interval)", color: C.blue, bg: "#3B82F620" },
                    { r: 4, label: "Mastered (Long interval)", color: C.ok, bg: "#10B98120" }
                  ].map(opt => (
                    <button key={opt.r} onClick={() => handleRate(opt.r)}
                      style={{
                        background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12,
                        padding: "12px 16px", cursor: "pointer", color: C.text, fontSize: 12,
                        fontWeight: 600, transition: "all 0.2s", textAlign: "center"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.background = opt.bg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Navigation */}
      {currentSubStep < 4 && (
        <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 14, flexShrink: 0 }}>
          <button onClick={handleBackSubStep} disabled={currentSubStep === 0}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "10px 16px", color: currentSubStep === 0 ? C.dim : C.muted, fontSize: 12,
              fontWeight: 600, cursor: currentSubStep === 0 ? "not-allowed" : "pointer"
            }}>
            Back
          </button>
          <button onClick={handleNextSubStep} disabled={currentSubStep === 3 && pickedOpt === null}
            style={{
              flex: 1, background: (currentSubStep === 3 && pickedOpt === null) ? C.card : C.accent,
              border: "none", borderRadius: 10, padding: "10px 16px",
              color: (currentSubStep === 3 && pickedOpt === null) ? C.dim : "#000",
              fontSize: 12, fontWeight: 700, cursor: (currentSubStep === 3 && pickedOpt === null) ? "not-allowed" : "pointer"
            }}>
            {currentSubStep === (energyMode === "low" ? 1 : 3) ? "Rate Confidence →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
