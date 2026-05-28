import { useState, useEffect } from "react";
import {
  BookOpen, Brain, Zap, Clock, TrendingUp, Home,
  BarChart2, FlaskConical, Play, AlertTriangle,
  RotateCcw, Target, Battery, ChevronRight, Star,
  BookMarked, Shield, FileText, RefreshCw, WifiOff
} from "lucide-react";

import { SUBJECTS, ELECTIVES, MODULES, TOPICS, MICRO_LESSONS, FORMULAS, RBI_CIRCULARS } from "./data/contentGraph";
import { getAllCardStates, seedMockSpacedRepetitionData, getMemoryStrengthStats } from "./utils/spacedRepetition";
import { calculatePassProbability } from "./utils/aiOrchestrator";

// Component imports
import Onboarding from "./components/Onboarding";
import StudyPanel from "./components/StudyPanel";
import RevisionInbox from "./components/RevisionInbox";
import PassOptimizer from "./components/PassOptimizer";
import Circulars from "./components/Circulars";

/* ── Palette & Styles ─────────────────────────────────────── */
const C = {
  bg: "#070F1C", surf: "#0B1929", card: "#0F2240", cardAlt: "#0D1E38",
  border: "#1B3454", accent: "#E9A020", accentL: "#FDD060",
  teal: "#2DD4BF", blue: "#60A5FA", purple: "#A78BFA",
  text: "#EDF2F8", muted: "#7890A8", dim: "#3A5570",
  ok: "#4ADE80", warn: "#FB923C", err: "#F87171",
};

const font = "'DM Sans', system-ui, sans-serif";

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [tab, setTab] = useState("home");
  
  // Study session states
  const [sessionQueue, setSessionQueue] = useState([]);
  const [energyMode, setEnergyMode] = useState("low"); // low, focus, rapid
  
  // Offline sync indicator states
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");
  const [dbSize, setDbSize] = useState("14 KB");

  // Gemini API states (Step 1 Roadmap)
  const [apiKey, setApiKey] = useState(sessionStorage.getItem("gemini_api_key") || "");
  const [apiStatus, setApiStatus] = useState("disconnected");

  useEffect(() => {
    if (!apiKey) {
      setApiStatus("disconnected");
      return;
    }

    const verifyKey = async () => {
      setApiStatus("verifying");
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
        });
        if (res.ok) {
          setApiStatus("active");
          sessionStorage.setItem("gemini_api_key", apiKey);
        } else {
          setApiStatus("error");
        }
      } catch (e) {
        setApiStatus("error");
      }
    };

    const timer = setTimeout(verifyKey, 500); // debounce API verification
    return () => clearTimeout(timer);
  }, [apiKey]);

  // Active Subject selection in traversable syllabus map
  const [activeSubject, setActiveSubject] = useState("BFM");
  const [expandedModule, setExpandedModule] = useState("BFM-B");
  const [selectedFormulaTab, setSelectedFormulaTab] = useState("All");

  // Seed mock spaced repetition queue on launch
  useEffect(() => {
    seedMockSpacedRepetitionData(MICRO_LESSONS, FORMULAS);
    
    const onboarded = localStorage.getItem("caiib_onboarded") === "true";
    if (onboarded) {
      setIsOnboarded(true);
      const profile = localStorage.getItem("caiib_user_profile");
      if (profile) {
        setUserProfile(JSON.parse(profile));
      }
    }
  }, []);

  const handleOnboardingComplete = (profile) => {
    setUserProfile(profile);
    setIsOnboarded(true);
    setTab("home");
  };

  const handleStartStudySession = (queue, mode = "low") => {
    setSessionQueue(queue);
    setEnergyMode(mode);
    setTab("study_session");
  };

  // Launch a lesson for a specific topic
  const handleLaunchTopicLesson = (topicId) => {
    const lesson = MICRO_LESSONS.find(l => l.topicId === topicId);
    if (lesson) {
      handleStartStudySession([lesson], energyMode);
    } else {
      // Create a dummy lesson structured card if no pre-built one exists
      const dummyLesson = {
        id: `L-${topicId}`,
        topicId,
        subjectId: activeSubject,
        title: TOPICS[expandedModule]?.find(t => t.id === topicId)?.name || "Syllabus Unit",
        badge: "Auto Generated",
        steps: [
          {
            kind: "concept",
            title: "Core Concept",
            body: "This unit covers specialized regulations, compliance benchmarks, and reporting standards under CAIIB statutory guidelines.",
            highlight: "Review linked RBI master directives for circular overlaps."
          },
          {
            kind: "pillars",
            title: "Regulatory Pillars",
            pillars: [
              { e: "📑", n: "Pillar A", d: "Standard operational audits & reporting guidelines." },
              { e: "🛡️", n: "Pillar B", d: "Supervisory risk indicators and reserve ratios." }
            ]
          }
        ]
      };
      handleStartStudySession([dummyLesson], energyMode);
    }
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
      // calculate size based on localStorage length
      const len = JSON.stringify(localStorage).length;
      setDbSize(`${(len / 1024).toFixed(1)} KB`);
    }, 800);
  };

  const handleResetApp = () => {
    if (confirm("Reset onboarding and all progress states?")) {
      localStorage.clear();
      setIsOnboarded(false);
      setUserProfile(null);
      setTab("home");
      window.location.reload();
    }
  };

  // Pass Probability computation
  const passStats = calculatePassProbability(userProfile, 0);

  return (
    <div style={{
      fontFamily: font, background: "#030810",
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, position: "relative"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1B3454; border-radius: 99px; }
        button { font-family: inherit; }
      `}</style>

      {/* Control Panel */}
      <div style={{
        position: "fixed", top: 20, left: 30, display: "flex", flexDirection: "column", gap: 10,
        color: C.muted, fontSize: 11, maxWidth: 220
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.accent, fontWeight: 700, letterSpacing: "0.05em" }}>
          <Shield size={14} />
          <span>CAIIB COGNITIVE SYSTEM</span>
        </div>
        <p style={{ color: C.dim, fontSize: 10, lineHeight: 1.4 }}>
          Fatigue-aware, spaced-repetition mobile application prototype.
        </p>

        {/* Gemini API Input Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8 }}>
          <label style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Gemini API Key</label>
          <input type="password" placeholder="AI API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            style={{
              background: C.surf, border: `1px solid ${C.border}`, borderRadius: 4,
              color: C.text, fontSize: 10, padding: "4px 6px", outline: "none", width: "100%"
            }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: apiStatus === "active" ? C.ok : apiStatus === "verifying" ? C.warn : apiStatus === "error" ? C.err : C.dim
            }} />
            <span style={{ fontSize: 9, color: C.muted, textTransform: "capitalize" }}>
              {apiStatus === "active" ? "AI Live (Gemini Active)" : apiStatus === "verifying" ? "Verifying..." : apiStatus === "error" ? "Invalid Key" : "No Key (Local Fallback)"}
            </span>
          </div>
        </div>

        <button onClick={handleResetApp}
          style={{
            background: `${C.err}18`, border: `1px solid ${C.err}33`, color: C.err,
            borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 700, width: "fit-content"
          }}>
          Reset Database
        </button>
      </div>

      {/* Phone Mockup Frame */}
      <div style={{
        width: 390, height: 840, background: C.surf,
        borderRadius: 44, overflow: "hidden", position: "relative",
        boxShadow: "0 60px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column"
      }}>

        {/* Status Bar */}
        <div style={{
          height: 44, background: C.surf, display: "flex",
          alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", flexShrink: 0, zIndex: 10
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
              {[7, 9, 11, 13].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: i < 3 ? C.text : C.dim }} />
              ))}
            </div>
            <span style={{ color: C.text, fontSize: 12 }}>5G</span>
            <div style={{ width: 24, height: 12, border: `1.5px solid ${C.text}`, borderRadius: 3, position: "relative" }}>
              <div style={{ position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)", width: 2, height: 6, background: C.text, borderRadius: "0 1px 1px 0" }} />
              <div style={{ margin: 1.5, height: 7, width: "75%", background: C.ok, borderRadius: 1 }} />
            </div>
          </div>
        </div>

        {/* Simulated Offline-First Header Bar */}
        <div style={{
          background: C.cardAlt, borderBottom: `1.5px solid ${C.border}`, height: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <WifiOff size={11} color={C.teal} />
            <span style={{ fontSize: 10, fontWeight: 600, color: C.teal, letterSpacing: "0.03em" }}>Offline Mode Active</span>
          </div>
          <button onClick={handleTriggerSync} disabled={isSyncing}
            style={{
              background: "none", border: "none", display: "flex", alignItems: "center", gap: 4,
              color: C.muted, fontSize: 9, cursor: "pointer", padding: 0
            }}>
            <RefreshCw size={9} className={isSyncing ? "spin-animate" : ""} style={{ color: C.muted }} />
            <span>DB: {dbSize} · Sync: {lastSyncTime}</span>
          </button>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spin-animate { animation: spin 0.8s linear infinite; }
          `}</style>
        </div>

        {/* Active Screen Area */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {!isOnboarded ? (
            <Onboarding onComplete={handleOnboardingComplete} />
          ) : (
            <>
              {/* HOME SCREEN */}
              {tab === "home" && (
                <div style={{ height: "100%", overflowY: "auto", padding: "20px 20px 0" }}>
                  {/* Greeting */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>Welcome back, Banker 👋</p>
                    <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                      CAIIB Preparation Dashboard
                    </h1>
                    <p style={{ color: C.accent, fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                      🎯 Target Elective: {userProfile?.elective ? ELECTIVES.find(e=>e.id===userProfile.elective)?.name : "Risk Management"}
                    </p>
                  </div>

                  {/* Study Modes Panel */}
                  <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Select Adaptive Study Session
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {[
                      { id: "low", Icon: Battery, label: "Low Energy Mode", sub: "Audio cards · One-handed swipe review", color: C.teal, bg: "#071E1C", mins: "5–10 min" },
                      { id: "focus", Icon: Brain, label: "Deep Focus Mode", sub: "Numerical scenarios · Solved cases · Calculator", color: C.blue, bg: "#081830", mins: "20–40 min" },
                      { id: "rapid", Icon: Zap, label: "Rapid Revision Mode", sub: "Formula drills · Weak memory queue", color: C.accent, bg: "#1E1505", mins: "10–15 min" }
                    ].map(m => {
                      const active = energyMode === m.id;
                      return (
                        <button key={m.id} onClick={() => setEnergyMode(m.id)}
                          style={{
                            background: active ? m.bg : C.card,
                            border: `1.5px solid ${active ? m.color : C.border}`,
                            borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all 0.2s"
                          }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, background: `${m.color}20`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                          }}>
                            <m.Icon size={18} color={m.color} />
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <p style={{ color: C.text, fontWeight: 600, fontSize: 13, margin: 0 }}>{m.label}</p>
                            <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{m.sub}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ color: m.color, fontSize: 11, fontWeight: 600 }}>{m.mins}</span>
                            {active && (
                              <div style={{ marginTop: 4 }}>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  // Load micro lessons matching subject filter
                                  const list = MICRO_LESSONS.filter(l => l.subjectId === "BFM" || l.subjectId === "ABM");
                                  handleStartStudySession(list, m.id);
                                }}
                                  style={{
                                    background: m.color, border: "none", borderRadius: 6,
                                    color: "#000", fontSize: 10, fontWeight: 700, padding: "3px 8px", cursor: "pointer"
                                  }}>
                                  Start →
                                </button>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Continue Study Block */}
                  <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>UP NEXT</span>
                        <h4 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: "2px 0" }}>Basel III Framework</h4>
                        <span style={{ fontSize: 9, background: `${C.blue}20`, color: C.blue, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>BFM · Module B</span>
                      </div>
                      <button onClick={() => handleLaunchTopicLesson("T-BFM-B1")}
                        style={{
                          background: C.accent, border: "none", borderRadius: "50%",
                          width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                        <Play size={16} color="#000" fill="#000" style={{ marginLeft: 2 }} />
                      </button>
                    </div>
                  </div>

                  {/* Pass Probability Snapshot */}
                  <div onClick={() => setTab("strategy")}
                    style={{
                      background: `${C.accent}12`, border: `1.5px solid ${C.accent}44`, borderRadius: 14,
                      padding: 14, marginBottom: 24, cursor: "pointer", display: "flex", alignItems: "center", gap: 12
                    }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.accent, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                        Pass Probability Indicator
                      </p>
                      <p style={{ color: C.text, fontSize: 20, fontWeight: 800, margin: "2px 0" }}>
                        {passStats.probability}% <span style={{ color: passStats.statusColor, fontSize: 11, fontWeight: 600 }}>{passStats.statusText}</span>
                      </p>
                      <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Projected Aggregate {passStats.aggregate}/100 · Open Optimizer →</p>
                    </div>
                    <ChevronRight size={18} color={C.accent} />
                  </div>
                </div>
              )}

              {/* TRAVERSABLE SYLLABUS MAP SCREEN */}
              {tab === "study" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "20px 20px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Syllabus Explorer</h2>
                  </div>

                  {/* Subject Pickers */}
                  <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 10, flexShrink: 0 }}>
                    {SUBJECTS.concat(ELECTIVES.filter(e => e.id === (userProfile?.elective || "Risk"))).map(s => (
                      <button key={s.id} onClick={() => { setActiveSubject(s.id); setExpandedModule(`${s.id}-A`); }}
                        style={{
                          background: activeSubject === s.id ? s.color : C.card,
                          border: `1.5px solid ${activeSubject === s.id ? s.color : C.border}`,
                          borderRadius: 8, padding: "6px 12px", color: activeSubject === s.id ? "#000" : C.muted,
                          fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Module List & Topic Tree */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
                    {(MODULES[activeSubject] || []).map(m => {
                      const isExpanded = expandedModule === m.id;
                      const topics = TOPICS[m.id] || [];
                      return (
                        <div key={m.id} style={{
                          background: C.card, border: `1.5px solid ${isExpanded ? C.border : "transparent"}`,
                          borderRadius: 12, overflow: "hidden"
                        }}>
                          <button onClick={() => setExpandedModule(isExpanded ? null : m.id)}
                            style={{
                              width: "100%", background: "none", border: "none", padding: "12px 14px",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              cursor: "pointer", textAlign: "left"
                            }}>
                            <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{m.name}</span>
                            <span style={{ color: C.muted, fontSize: 11 }}>{isExpanded ? "▲" : "▼"}</span>
                          </button>

                          {isExpanded && (
                            <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                              {topics.length === 0 ? (
                                <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>No topics configured yet.</p>
                              ) : (
                                topics.map(t => (
                                  <div key={t.id} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px"
                                  }}>
                                    <div style={{ overflow: "hidden", flex: 1 }}>
                                      <p style={{ color: C.text, fontSize: 12, fontWeight: 600, margin: 0, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{t.name}</p>
                                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
                                        <span style={{
                                          fontSize: 9, fontWeight: 700,
                                          color: t.weightage === "Critical" ? C.err : t.weightage === "High" ? C.warn : C.teal
                                        }}>{t.weightage} Weight</span>
                                        {t.dependency.length > 0 && (
                                          <span style={{ color: C.muted, fontSize: 9 }}>· Requires {t.dependency[0].replace("T-", "")}</span>
                                        )}
                                      </div>
                                    </div>
                                    <button onClick={() => handleLaunchTopicLesson(t.id)}
                                      style={{
                                        background: C.accent, border: "none", borderRadius: 6,
                                        padding: "4px 10px", color: "#000", fontSize: 10, fontWeight: 700,
                                        cursor: "pointer", marginLeft: 10, flexShrink: 0
                                      }}>
                                      Study
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Formula sheet quick index */}
                    <div style={{ marginTop: 10, borderTop: `1.5px solid ${C.border}`, paddingTop: 14 }}>
                      <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>Formula Revision Index</p>
                      
                      {/* Filter */}
                      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                        {["All", "BFM", "ABM", "ABFM"].map(f => (
                          <button key={f} onClick={() => setSelectedFormulaTab(f)}
                            style={{
                              background: selectedFormulaTab === f ? C.accent : C.card,
                              border: `1px solid ${selectedFormulaTab === f ? C.accent : C.border}`,
                              borderRadius: 6, padding: "4px 8px", color: selectedFormulaTab === f ? "#000" : C.muted,
                              fontSize: 10, fontWeight: 600, cursor: "pointer"
                            }}>
                            {f}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {FORMULAS.filter(f => selectedFormulaTab === "All" || f.sub === selectedFormulaTab).map(f => (
                          <div key={f.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: C.teal }}>{f.sub} · {f.tag}</span>
                              <button onClick={() => handleStartStudySession([{ ...f, steps: [] }], "rapid")}
                                style={{ background: "none", border: "none", color: C.accent, fontSize: 10, cursor: "pointer", padding: 0 }}>
                                Review →
                              </button>
                            </div>
                            <p style={{ color: C.text, fontSize: 12, fontWeight: 700, margin: "2px 0 4px" }}>{f.name}</p>
                            <p style={{ color: C.accent, fontSize: 11, fontFamily: "monospace", margin: 0 }}>{f.f}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* REVISION INBOX SCREEN */}
              {tab === "revision" && (
                <RevisionInbox activeElective={userProfile?.elective}
                  onStartRevision={(lessons, formulas) => {
                    const combined = [...lessons, ...formulas];
                    handleStartStudySession(combined, "rapid");
                  }} />
              )}

              {/* PASS OPTIMIZER SCREEN */}
              {tab === "strategy" && (
                <PassOptimizer userProfile={userProfile} activeElective={userProfile?.elective} apiKey={apiKey}
                  onReviseWeakness={(lessonId) => {
                    const lesson = MICRO_LESSONS.find(l => l.id === lessonId);
                    if (lesson) handleStartStudySession([lesson], "rapid");
                  }} />
              )}

              {/* RBI CIRCULARS SCREEN */}
              {tab === "circulars" && (
                <Circulars onNavigateToLesson={(topicId) => {
                  handleLaunchTopicLesson(topicId);
                }} />
              )}

              {/* ACTIVE STUDY SESSION CONTAINER */}
              {tab === "study_session" && (
                <StudyPanel sessionQueue={sessionQueue} energyMode={energyMode} setTab={setTab} apiKey={apiKey}
                  onSessionComplete={() => {
                    alert("🎓 Study session complete! Progress logged and synced locally.");
                    setTab("home");
                  }} />
              )}
            </>
          )}
        </div>

        {/* Bottom Tab Bar Navigation */}
        {isOnboarded && tab !== "study_session" && (
          <div style={{
            background: C.surf, borderTop: `1.5px solid ${C.border}`,
            display: "flex", padding: "8px 0 20px", flexShrink: 0, zIndex: 10
          }}>
            {[
              { id: "home", Icon: Home, label: "Home" },
              { id: "study", Icon: BookOpen, label: "Explore" },
              { id: "revision", Icon: RotateCcw, label: "Inbox" },
              { id: "strategy", Icon: BarChart2, label: "Strategy" },
              { id: "circulars", Icon: FileText, label: "Circulars" }
            ].map(it => {
              const active = tab === it.id;
              return (
                <button key={it.id} onClick={() => setTab(it.id)}
                  style={{
                    flex: 1, background: "none", border: "none", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 0
                  }}>
                  <div style={{
                    width: 36, height: 26, display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: 14,
                    background: active ? `${C.accent}22` : "transparent",
                    transition: "background 0.2s"
                  }}>
                    <it.Icon size={18} color={active ? C.accent : C.dim} strokeWidth={active ? 2.5 : 1.8} />
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: active ? 700 : 500,
                    color: active ? C.accent : C.dim, letterSpacing: "0.02em"
                  }}>
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Side Legend Details */}
      <div style={{
        position: "fixed", right: 30, top: "50%", transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 16, color: C.dim, fontSize: 11, maxWidth: 140
      }}>
        {[
          ["Explore Tab", "Modular syllabus tree of subjects, topics, and checklists."],
          ["Inbox Tab", "Active SM-2 spaced repetition queue with memory ratings."],
          ["Strategy Tab", "Pass probability adjustments and mistake analysis."],
          ["Circulars Tab", "Live RBI regulatory updates mapped to study content."]
        ].map(([t, d]) => (
          <div key={t}>
            <p style={{ color: "#3A5570", fontWeight: 700, marginBottom: 2 }}>{t}</p>
            <p style={{ color: "#1B3454", fontSize: 10, lineHeight: 1.3 }}>{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
