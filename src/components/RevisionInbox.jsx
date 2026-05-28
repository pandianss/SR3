import { useState, useEffect } from "react";
import { getRevisionQueue, getMemoryStrengthStats, getAllCardStates } from "../utils/spacedRepetition";
import { MICRO_LESSONS, FORMULAS } from "../data/contentGraph";
import { BookOpen, FlaskConical, Play, CheckCircle, RefreshCcw, Brain, Award } from "lucide-react";

export default function RevisionInbox({ onStartRevision, activeElective }) {
  const [queue, setQueue] = useState({ dueLessons: [], dueFormulas: [] });
  const [stats, setStats] = useState({ mastered: 0, reviewing: 0, forgotten: 0, unreviewed: 0, retentionRate: 0 });
  const [filter, setFilter] = useState("all"); // all, lessons, formulas

  const C = {
    bg: "#070F1C", surf: "#0B1929", card: "#0F2240", cardAlt: "#0D1E38",
    border: "#1B3454", accent: "#E9A020", accentL: "#FDD060",
    teal: "#2DD4BF", blue: "#60A5FA", purple: "#A78BFA",
    text: "#EDF2F8", muted: "#7890A8", dim: "#3A5570",
    ok: "#4ADE80", warn: "#FB923C", err: "#F87171",
  };

  useEffect(() => {
    // Filter down to syllabus content matching active elective (or core)
    const availableLessons = MICRO_LESSONS.filter(l => l.subjectId !== "Risk" || activeElective === "Risk");
    // Also include other electives if any (they aren't loaded in MICRO_LESSONS yet, but good practice)
    
    const { dueLessons, dueFormulas } = getRevisionQueue(availableLessons, FORMULAS);
    setQueue({ dueLessons, dueFormulas });
    
    const currentStats = getMemoryStrengthStats(availableLessons.length, FORMULAS.length);
    setStats(currentStats);
  }, [activeElective]);

  const totalDue = queue.dueLessons.length + queue.dueFormulas.length;

  const handleStartReview = () => {
    if (totalDue === 0) return;
    onStartRevision(queue.dueLessons, queue.dueFormulas);
  };

  const getSubColor = (sub) => {
    if (sub === "ABM") return C.teal;
    if (sub === "BFM") return C.blue;
    if (sub === "ABFM") return C.warn;
    if (sub === "BRBL") return C.purple;
    return C.accent; // elective
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>
          Revision Inbox
        </h2>
        {totalDue > 0 && (
          <button onClick={handleStartReview}
            style={{
              background: C.accent, border: "none", borderRadius: 10,
              padding: "6px 12px", color: "#000", fontSize: 12, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}>
            <Play size={12} fill="#000" />
            Review {totalDue} Due
          </button>
        )}
      </div>

      {/* Spaced Rep Stats */}
      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Retained Memory Strength
            </p>
            <p style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: "2px 0 0" }}>
              {stats.retentionRate}% <span style={{ fontSize: 11, color: C.teal, fontWeight: 500 }}>Retention</span>
            </p>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${C.teal}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={20} color={C.teal} />
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          {[
            { label: "Mastered", val: stats.mastered, color: C.ok },
            { label: "Reviewing", val: stats.reviewing, color: C.blue },
            { label: "Forgotten", val: stats.forgotten, color: C.err },
            { label: "New", val: stats.unreviewed, color: C.muted }
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ color: s.color, fontSize: 15, fontWeight: 700, margin: 0 }}>{s.val}</p>
              <p style={{ color: C.muted, fontSize: 9, margin: "2px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { id: "all", label: `All (${totalDue})` },
          { id: "lessons", label: `Lessons (${queue.dueLessons.length})` },
          { id: "formulas", label: `Formulas (${queue.dueFormulas.length})` }
        ].map(btn => (
          <button key={btn.id} onClick={() => setFilter(btn.id)}
            style={{
              background: filter === btn.id ? `${C.accent}20` : C.card,
              border: `1.5px solid ${filter === btn.id ? C.accent : C.border}`,
              borderRadius: 8, padding: "5px 10px", color: filter === btn.id ? C.accent : C.muted,
              fontSize: 11, fontWeight: 600, cursor: "pointer"
            }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Queue Lists */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 24 }}>
        
        {totalDue === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: C.cardAlt, borderRadius: 14, border: `1.5px dashed ${C.border}` }}>
            <Award size={36} color={C.ok} style={{ margin: "0 auto 12px" }} />
            <p style={{ color: C.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Inbox Zero!</p>
            <p style={{ color: C.muted, fontSize: 12, margin: "4px 0 0", lineHeight: 1.4 }}>
              All concepts, numericals, and formulas are fully retained in your long-term memory buffer. No due cards to revise.
            </p>
          </div>
        ) : (
          <>
            {/* Lessons Section */}
            {(filter === "all" || filter === "lessons") && queue.dueLessons.map(lesson => (
              <button key={lesson.id} onClick={handleStartReview}
                style={{
                  background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12,
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                  textAlign: "left", cursor: "pointer", width: "100%"
                }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${getSubColor(lesson.subjectId)}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={16} color={getSubColor(lesson.subjectId)} />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: getSubColor(lesson.subjectId), fontSize: 9, fontWeight: 700 }}>{lesson.subjectId}</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim }} />
                    <span style={{ color: C.muted, fontSize: 9 }}>{lesson.badge}</span>
                  </div>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "2px 0 0", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                    {lesson.title}
                  </p>
                </div>
                <span style={{ color: C.err, fontSize: 10, fontWeight: 600 }}>DUE NOW</span>
              </button>
            ))}

            {/* Formulas Section */}
            {(filter === "all" || filter === "formulas") && queue.dueFormulas.map(formula => (
              <button key={formula.id} onClick={handleStartReview}
                style={{
                  background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12,
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                  textAlign: "left", cursor: "pointer", width: "100%"
                }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${getSubColor(formula.sub)}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FlaskConical size={16} color={getSubColor(formula.sub)} />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: getSubColor(formula.sub), fontSize: 9, fontWeight: 700 }}>{formula.sub}</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim }} />
                    <span style={{ color: C.muted, fontSize: 9 }}>{formula.tag}</span>
                  </div>
                  <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "2px 0 0", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                    {formula.name}
                  </p>
                </div>
                <span style={{ color: C.err, fontSize: 10, fontWeight: 600 }}>DUE NOW</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
