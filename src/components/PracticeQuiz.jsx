import { useState, useEffect } from "react";
import { C } from "../theme";
import { SUBJECTS, ELECTIVES } from "../data/contentGraph";
import { getPracticeSet, getQuestionsForSubject } from "../data/questionBank";
import { CheckCircle, XCircle, RotateCcw, ChevronRight, Target } from "lucide-react";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

export default function PracticeQuiz({ userProfile, isPremium, onPaywall }) {
  const [activeSubject, setActiveSubject]   = useState("BFM");
  const [difficulty, setDifficulty]         = useState("All");
  const [questions, setQuestions]           = useState([]);
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [picked, setPicked]                 = useState(null);
  const [score, setScore]                   = useState(0);
  const [done, setDone]                     = useState(false);
  const [showExplain, setShowExplain]       = useState(false);
  const [sessionSize]                       = useState(10);

  const FREE_SUBJECTS = ["ABM", "BFM"];

  function startSession() {
    let pool = getQuestionsForSubject(activeSubject);
    if (difficulty !== "All") pool = pool.filter(q => q.difficulty === difficulty);
    const set = [...pool].sort(() => Math.random() - 0.5).slice(0, sessionSize);
    setQuestions(set);
    setCurrentIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setShowExplain(false);
  }

  useEffect(() => { startSession(); }, [activeSubject, difficulty]);

  const q = questions[currentIdx];
  const isCorrect = picked === q?.correct;
  const total = questions.length;

  function handlePick(idx) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct) setScore(s => s + 1);
  }

  function handleNext() {
    if (currentIdx + 1 >= total) { setDone(true); return; }
    setCurrentIdx(i => i + 1);
    setPicked(null);
    setShowExplain(false);
  }

  const allSubjects = SUBJECTS.concat(ELECTIVES);

  if (done) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 75 ? { label: "Excellent!", color: C.ok }
      : pct >= 50 ? { label: "Borderline", color: C.warn }
      : { label: "Needs Work", color: C.err };
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20 }}>
        <div style={{ fontSize: 48 }}>{pct >= 75 ? "🏆" : pct >= 50 ? "📈" : "📚"}</div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: grade.color, fontWeight: 800, fontSize: 36, margin: 0 }}>{pct}%</p>
          <p style={{ color: grade.color, fontWeight: 700, fontSize: 14, margin: "4px 0 8px" }}>{grade.label}</p>
          <p style={{ color: C.muted, fontSize: 13 }}>{score} correct out of {total} questions · {activeSubject}</p>
        </div>
        <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 300 }}>
          <button onClick={startSession}
            style={{ flex: 1, background: C.accent, border: "none", borderRadius: 12, padding: "12px 0", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <RotateCcw size={14} /> Try Again
          </button>
          <button onClick={() => { setDifficulty("Hard"); startSession(); }}
            style={{ flex: 1, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 0", color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Hard Only
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Subject tabs */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 8 }}>
          {allSubjects.map(s => {
            const locked = !isPremium && !FREE_SUBJECTS.includes(s.id);
            const active = activeSubject === s.id;
            return (
              <button key={s.id}
                onClick={() => locked ? onPaywall("subject") : setActiveSubject(s.id)}
                style={{
                  background: active ? s.color : C.card,
                  border: `1.5px solid ${active ? s.color : C.border}`,
                  borderRadius: 8, padding: "5px 12px",
                  color: active ? "#000" : locked ? C.dim : C.muted,
                  fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  opacity: locked ? 0.6 : 1
                }}>
                {s.label}{locked ? " 🔒" : ""}
              </button>
            );
          })}
        </div>

        {/* Difficulty + count */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8 }}>
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              style={{
                background: difficulty === d ? C.blue : C.card,
                border: `1px solid ${difficulty === d ? C.blue : C.border}`,
                borderRadius: 6, padding: "3px 10px",
                color: difficulty === d ? "#fff" : C.muted,
                fontSize: 10, fontWeight: 600, cursor: "pointer"
              }}>{d}</button>
          ))}
          <span style={{ color: C.dim, fontSize: 10, marginLeft: "auto" }}>
            {getQuestionsForSubject(activeSubject).length} questions available
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 16px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: C.muted, fontSize: 11 }}>Q {currentIdx + 1} of {total}</span>
          <span style={{ color: C.teal, fontSize: 11, fontWeight: 700 }}>{score} correct</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 99 }}>
          <div style={{ height: 4, borderRadius: 99, background: C.accent, width: `${((currentIdx) / total) * 100}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Question */}
      {!q ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: C.muted, fontSize: 13 }}>No questions available for this filter.</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Difficulty badge */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: q.difficulty === "Hard" ? `${C.err}20` : q.difficulty === "Medium" ? `${C.warn}20` : `${C.ok}20`,
              color: q.difficulty === "Hard" ? C.err : q.difficulty === "Medium" ? C.warn : C.ok,
              border: `1px solid ${q.difficulty === "Hard" ? C.err : q.difficulty === "Medium" ? C.warn : C.ok}44`
            }}>{q.difficulty}</span>
            <span style={{ color: C.dim, fontSize: 9 }}>{q.subjectId} · {q.topicId}</span>
          </div>

          {/* Question text */}
          <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <p style={{ color: C.text, fontSize: 13, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{q.q}</p>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.opts.map((opt, idx) => {
              const isSelected = picked === idx;
              const isCorrectOpt = idx === q.correct;
              let bg = C.card, border = C.border, col = C.text;
              if (picked !== null) {
                if (isCorrectOpt) { bg = `${C.ok}18`; border = C.ok; col = C.ok; }
                else if (isSelected) { bg = `${C.err}18`; border = C.err; col = C.err; }
              }
              return (
                <button key={idx} disabled={picked !== null} onClick={() => handlePick(idx)}
                  style={{
                    background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
                    padding: "11px 14px", cursor: picked === null ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left", width: "100%"
                  }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", background: `${col}18`,
                    border: `1.5px solid ${col}`, fontSize: 10, fontWeight: 800, color: col,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>{String.fromCharCode(65 + idx)}</span>
                  <span style={{ color: col, fontSize: 12, lineHeight: 1.4 }}>{opt}</span>
                  {picked !== null && isCorrectOpt && <CheckCircle size={14} color={C.ok} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                  {picked !== null && isSelected && !isCorrectOpt && <XCircle size={14} color={C.err} style={{ marginLeft: "auto", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {picked !== null && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => setShowExplain(s => !s)}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: C.muted, fontSize: 11, fontWeight: 600, textAlign: "left" }}>
                {showExplain ? "▲ Hide" : "▼ Show"} explanation
              </button>
              {showExplain && (
                <div style={{ background: isCorrect ? `${C.ok}10` : `${C.err}10`, border: `1px solid ${isCorrect ? C.ok : C.err}33`, borderRadius: 10, padding: 12 }}>
                  <p style={{ color: isCorrect ? C.ok : C.err, fontWeight: 700, fontSize: 11, margin: "0 0 4px" }}>
                    {isCorrect ? "✅ Correct" : "❌ Incorrect"}
                  </p>
                  <p style={{ color: C.text, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{q.why}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer nav */}
      {q && picked !== null && (
        <div style={{ padding: "10px 16px 16px", flexShrink: 0, borderTop: `1px solid ${C.border}` }}>
          <button onClick={handleNext}
            style={{
              width: "100%", background: C.accent, border: "none", borderRadius: 12,
              padding: "13px 0", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}>
            {currentIdx + 1 >= total ? "See Results" : "Next Question"}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
