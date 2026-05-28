import { useState } from "react";
import { Delete, X } from "lucide-react";
import { C } from "../theme";

export default function NumericalCalculator({ onClose }) {
  const [display, setDisplay] = useState("0");
  const [prevVal, setPrevVal] = useState(null);
  const [operation, setOperation] = useState(null);
  const [clearOnNext, setClearOnNext] = useState(false);
  const [memory, setMemory] = useState(0);

  const handleDigit = (digit) => {
    if (display === "0" || display === "Error" || clearOnNext) {
      setDisplay(digit);
      setClearOnNext(false);
    } else {
      if (digit === "." && display.includes(".")) return;
      setDisplay(display + digit);
    }
  };

  const handleOp = (op) => {
    if (display === "Error") { handleClear(); return; }
    const val = parseFloat(display);
    if (operation && prevVal !== null && !clearOnNext) {
      const result = calculate(prevVal, val, operation);
      setDisplay(String(result));
      setPrevVal(result === "Error" ? null : result);
    } else {
      setPrevVal(val);
    }
    setOperation(op);
    setClearOnNext(true);
  };

  const calculate = (a, b, op) => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : "Error";
      default: return b;
    }
  };

  const handleEqual = () => {
    if (!operation || prevVal === null) return;
    if (display === "Error") { handleClear(); return; }
    const val = parseFloat(display);
    const result = calculate(prevVal, val, operation);
    setDisplay(result === "Error" ? "Error" : String(parseFloat(result.toFixed(6))));
    setPrevVal(null);
    setOperation(null);
    setClearOnNext(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevVal(null);
    setOperation(null);
    setClearOnNext(false);
  };

  const handleSqrt = () => {
    const val = parseFloat(display);
    if (val >= 0) {
      setDisplay(String(parseFloat(Math.sqrt(val).toFixed(6))));
      setClearOnNext(true);
    } else {
      // Negative square root is undefined in real numbers — surface the error.
      setDisplay("Error");
      setClearOnNext(true);
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
    setClearOnNext(true);
  };

  const handleMemory = (memOp) => {
    const val = parseFloat(display);
    switch (memOp) {
      case "MC":
        setMemory(0);
        break;
      case "MR":
        setDisplay(String(memory));
        setClearOnNext(true);
        break;
      case "M+":
        setMemory(memory + val);
        setClearOnNext(true);
        break;
      case "M-":
        setMemory(memory - val);
        setClearOnNext(true);
        break;
    }
  };

  return (
    <div style={{
      width: 250, background: "#050B14", border: `1.5px solid ${C.border}`,
      borderRadius: 16, padding: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
      display: "flex", flexDirection: "column", gap: 8
    }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Physical Calculator Simulator
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
          <X size={14} />
        </button>
      </div>

      {/* Screen */}
      <div style={{
        background: "#1E2736", borderRadius: 8, padding: "8px 12px", textAlign: "right",
        fontFamily: "monospace", fontSize: 20, color: "#60E0A0", height: 38,
        display: "flex", alignItems: "center", justifyContent: "flex-end", overflow: "hidden"
      }}>
        {display}
      </div>

      {/* Buttons Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {["MC", "MR", "M+", "M-"].map(btn => (
          <button key={btn} onClick={() => handleMemory(btn)}
            style={{
              background: C.cardAlt, border: `1px solid ${C.border}`, color: C.muted,
              borderRadius: 6, padding: "6px 0", fontSize: 10, fontWeight: 700, cursor: "pointer"
            }}>
            {btn}
          </button>
        ))}

        {["AC", "√", "%", "÷"].map(btn => (
          <button key={btn} onClick={() => {
            if (btn === "AC") handleClear();
            else if (btn === "√") handleSqrt();
            else if (btn === "%") handlePercent();
            else handleOp(btn);
          }}
            style={{
              background: btn === "AC" ? "#E11D4822" : C.card,
              border: `1px solid ${btn === "AC" ? "#E11D4844" : C.border}`,
              color: btn === "AC" ? "#FDA4AF" : C.accent,
              borderRadius: 6, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}>
            {btn}
          </button>
        ))}

        {[["7", "8", "9", "×"], ["4", "5", "6", "-"], ["1", "2", "3", "+"]].map((row, rIdx) =>
          row.map(btn => (
            <button key={`${rIdx}-${btn}`}
              // Operators: non-numeric and not the decimal point.
              onClick={() => (!isNaN(btn) || btn === ".") ? handleDigit(btn) : handleOp(btn)}
              style={{
                background: isNaN(btn) ? C.card : C.surf,
                border: `1px solid ${C.border}`,
                color: isNaN(btn) ? C.accent : C.text,
                borderRadius: 6, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer"
              }}>
              {btn}
            </button>
          ))
        )}

        {/* Last Row */}
        <button onClick={() => handleDigit("0")}
          style={{
            gridColumn: "span 2", background: C.surf, border: `1px solid ${C.border}`,
            color: C.text, borderRadius: 6, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>
          0
        </button>
        <button onClick={() => handleDigit(".")}
          style={{
            background: C.surf, border: `1px solid ${C.border}`, color: C.text,
            borderRadius: 6, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>
          .
        </button>
        <button onClick={handleEqual}
          style={{
            background: C.accent, border: "none", color: "#000",
            borderRadius: 6, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>
          =
        </button>
      </div>
    </div>
  );
}
