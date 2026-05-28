import { useState } from "react";
import { RBI_CIRCULARS } from "../data/contentGraph";
import { AlertCircle, Calendar, Bookmark, Link, Search } from "lucide-react";
import { C } from "../theme";

export default function Circulars({ onNavigateToLesson }) {
  const [selectedSub, setSelectedSub] = useState("All");
  const subjects = ["All", "BFM", "ABM", "IT"];

  const filtered = selectedSub === "All"
    ? RBI_CIRCULARS
    : RBI_CIRCULARS.filter(c => c.subjectId === selectedSub);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 20px 0" }}>
      <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
        RBI Circular Intelligence
      </h2>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
        Real-time ingested regulatory circulars parsed and mapped to the CAIIB syllabus.
      </p>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {subjects.map(sub => (
          <button key={sub} onClick={() => setSelectedSub(sub)}
            style={{
              background: selectedSub === sub ? C.accent : C.card,
              border: `1px solid ${selectedSub === sub ? C.accent : C.border}`,
              borderRadius: 8, padding: "5px 12px", color: selectedSub === sub ? "#000" : C.muted,
              fontSize: 11, fontWeight: 600, cursor: "pointer"
            }}>
            {sub}
          </button>
        ))}
      </div>

      {/* Circular Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
        {filtered.map(c => {
          const isHighRelevance = c.relevance >= 90;
          return (
            <div key={c.id} style={{
              background: C.card, border: `1.5px solid ${isHighRelevance ? `${C.accent}44` : C.border}`,
              borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10
            }}>
              {/* Top Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Calendar size={12} color={C.muted} />
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 500 }}>{c.date}</span>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim }} />
                  <span style={{ color: C.accent, fontSize: 10, fontWeight: 600 }}>{c.tag}</span>
                </div>
                <div style={{
                  background: isHighRelevance ? `${C.err}15` : `${C.warn}15`,
                  border: `1px solid ${isHighRelevance ? C.err : C.warn}`,
                  borderRadius: 4, padding: "2px 5px", fontSize: 9, fontWeight: 700,
                  color: isHighRelevance ? C.err : C.warn
                }}>
                  {c.relevance}% Exam Weight
                </div>
              </div>

              {/* Title */}
              <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
                {c.title}
              </h3>

              {/* Summary Box */}
              <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                <p style={{ color: C.text, fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                  {c.summary}
                </p>
              </div>

              {/* Action bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: C.dim, fontFamily: "monospace" }}>ID: {c.id}</span>
                {c.topicId && (
                  <button onClick={() => onNavigateToLesson(c.topicId)}
                    style={{
                      background: "none", border: "none", color: C.teal, fontSize: 11,
                      fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0
                    }}>
                    <Link size={12} />
                    View Linked Syllabus Unit →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
