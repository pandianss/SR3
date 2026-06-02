import { Component } from "react";
import { C, font } from "../theme";

// Top-level crash guard. Without this, any render-time throw white-screens the
// whole WebView with no recovery path (and no devtools for end users).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected error" };
  }

  componentDidCatch(error, info) {
    // Surface to console (and any attached crash reporter) for diagnosis.
    console.error("[ErrorBoundary] Caught render error:", error, info?.componentStack);
  }

  handleReload = () => {
    // Full reload re-runs bootstrap; local data and cloud sync are untouched.
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "32px 24px", gap: 16
      }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>🛠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5, maxWidth: 320 }}>
          The app hit an unexpected error. Your progress is saved — reloading usually fixes it.
        </p>
        <button onClick={this.handleReload}
          style={{
            background: C.accent, border: "none", borderRadius: 12,
            padding: "13px 28px", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer"
          }}>
          Reload App
        </button>
        {this.state.message && (
          <p style={{ color: C.dim, fontSize: 10, margin: 0, fontFamily: "monospace", maxWidth: 320, wordBreak: "break-word" }}>
            {this.state.message}
          </p>
        )}
      </div>
    );
  }
}
