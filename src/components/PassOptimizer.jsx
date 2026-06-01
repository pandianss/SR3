import { useState, useEffect, useRef } from "react";
import { calculatePassProbability, analyzeMistakePatterns, generateStudySchedule } from "../utils/aiOrchestrator";
import { TrendingUp, AlertTriangle, Lightbulb, Play, Settings } from "lucide-react";
import { C, getSubColor } from "../theme";

export default function PassOptimizer({ userProfile, onReviseWeakness, activeElective, partners = [] }) {
  const [studyAdjust, setStudyAdjust] = useState(0);
  const [data, setData] = useState({
    probability: 50,
    statusText: "",
    statusColor: "",
    aggregate: 0,
    projectedScores: {},
    subjectsBelow50: []
  });
  const [weaknesses, setWeaknesses] = useState([]);
  const [aiAdvisory, setAiAdvisory] = useState("");
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);
  // Ref used to debounce Gemini advisory calls while the slider is moving.
  const advisoryTimerRef = useRef(null);

  useEffect(() => {
    const res = calculatePassProbability(userProfile, studyAdjust);
    setData(res);
    setWeaknesses(analyzeMistakePatterns());
  }, [userProfile, studyAdjust, activeElective]);

  // Debounce advisory generation — fires 400ms after the last change, preventing
  // a Gemini request on every individual slider tick.
  useEffect(() => {
    const scores = data.projectedScores;
    // Don't fire on the initial render before any scores exist.
    if (Object.keys(scores).length === 0) return;

    if (advisoryTimerRef.current) clearTimeout(advisoryTimerRef.current);

    advisoryTimerRef.current = setTimeout(async () => {
      setLoadingAdvisory(true);
      try {
        const text = await generateStudySchedule(scores, activeElective);
        setAiAdvisory(text);
      } catch (e) {
        setAiAdvisory("Failed to generate strategic advisory. Review projections manually.");
      }
      setLoadingAdvisory(false);
    }, 400);

    return () => {
      if (advisoryTimerRef.current) clearTimeout(advisoryTimerRef.current);
    };
  }, [data.projectedScores, activeElective]);

  const r = 58, circ = 2 * Math.PI * r;
  const offset = circ * (1 - data.probability / 100);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 20px 0" }}>
      <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>
        Pass Optimizer
      </h2>

      {/* SVG Dial Panel */}
      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Dial */}
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="60" cy="60" r={r} fill="none"
                stroke={C.border} strokeWidth="8" />
              <circle cx="60" cy="60" r={r} fill="none"
                stroke={data.probability >= 75 ? C.ok : data.probability >= 50 ? C.warn : C.err}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: C.text, fontSize: 22, fontWeight: 800 }}>{data.probability}%</span>
              <span style={{ color: data.statusColor, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{data.statusText}</span>
            </div>
          </div>

          {/* Aggregate & Analysis */}
          <div style={{ flex: 1 }}>
            <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Projected Aggregate
            </p>
            <h3 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: "2px 0" }}>
              {data.aggregate} <span style={{ fontSize: 13, color: C.muted, fontWeight: 400 }}>/ 100</span>
            </h3>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: data.subjectsBelow50.length > 0 ? C.err : C.ok, fontWeight: 600 }}>
                {data.subjectsBelow50.length > 0
                  ? `${data.subjectsBelow50.length} Paper(s) below safety target`
                  : "All papers cleared!"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Study Adjust Slider */}
        <div style={{ marginTop: 18, borderTop: `1.5px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>Add Study Hours (Effort redistribution)</span>
            <span style={{ color: C.accent, fontSize: 13, fontWeight: 700 }}>+{studyAdjust} hrs/week</span>
          </div>
          <input type="range" min="0" max="10" step="1" value={studyAdjust}
            onChange={(e) => setStudyAdjust(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: C.accent, cursor: "pointer" }} />
          <p style={{ color: C.muted, fontSize: 10, margin: "4px 0 0" }}>
            Increasing study time dynamically boosts retention score algorithms on high-yield modules.
          </p>
        </div>
      </div>

      {/* AI Advisory Panel */}
      <div style={{
        background: `${C.teal}12`, border: `1.5px solid ${C.teal}33`, borderRadius: 16,
        padding: 16, marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ color: C.teal, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Strategic Advisory
          </span>
          {loadingAdvisory && <span style={{ color: C.muted, fontSize: 10, marginLeft: "auto" }}>Regenerating...</span>}
        </div>
        <p style={{ color: C.text, fontSize: 12.5, lineHeight: 1.45, margin: 0 }}>
          {loadingAdvisory ? "Ingesting score projections and scheduling study slots..." : aiAdvisory}
        </p>
      </div>

      {/* Paper Projections */}
      <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        Paper-wise Score Distribution
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {Object.entries(data.projectedScores).map(([sub, score]) => {
          const color = getSubColor(sub);
          const isAtRisk = score < 50;
          return (
            <div key={sub} style={{ background: C.card, border: `1.5px solid ${isAtRisk ? `${C.err}33` : C.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={{ color, fontWeight: 700, fontSize: 13 }}>{sub}</span>
                  {isAtRisk && <span style={{ color: C.err, fontSize: 10, marginLeft: 8, fontWeight: 600 }}>⚠ Risk Zone</span>}
                  {partners.filter(p => p.elective === sub || p.elective?.toUpperCase() === sub).map(p => (
                    <span key={p.uid} style={{ display: "inline-block", marginLeft: 8, fontSize: 9, fontWeight: 700, color: C.teal, background: `${C.teal}18`, border: `1px solid ${C.teal}33`, borderRadius: 4, padding: "1px 5px" }}>
                      👥 {p.name.split(" ")[0]} · {(p.xp || 0).toLocaleString()} XP
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: C.muted, fontSize: 11 }}>
                    Projected: <strong style={{ color: isAtRisk ? C.err : C.ok }}>{score}</strong>
                  </span>
                  <span style={{ color: C.dim, fontSize: 10 }}>Target: 50+</span>
                </div>
              </div>
              <div style={{ background: C.border, borderRadius: 99, height: 6, position: "relative", overflow: "hidden" }}>
                <div style={{ width: `${(score / 100) * 100}%`, height: "100%", background: isAtRisk ? C.err : color, transition: "width 0.4s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mistake Pattern Panel */}
      <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        AI Conceptual Weakness Detection
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {weaknesses.map((w, i) => (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: getSubColor(w.subject), background: `${getSubColor(w.subject)}22`, padding: "2px 6px", borderRadius: 4 }}>
                  {w.subject} · {w.type}
                </span>
                <h4 style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: "6px 0 2px" }}>{w.name}</h4>
              </div>
              <span style={{ color: C.err, fontSize: 11, fontWeight: 600 }}>
                {w.failureCount} error{w.failureCount > 1 ? "s" : ""}
              </span>
            </div>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.4, margin: "0 0 10px" }}>{w.recommendation}</p>
            {w.id.startsWith("L-") && (
              <button onClick={() => onReviseWeakness(w.id)}
                style={{
                  background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "6px 12px", color: C.accent, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}>
                <Play size={10} fill="currentColor" />
                Revise Concept
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
