import { useState } from "react";
import { signInWithGoogle, isConfigured } from "../utils/firebase";
import { Shield, AlertTriangle, Tag } from "lucide-react";
import { C, font } from "../theme";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";

export default function AuthScreen({ onSignedIn }) {
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [legalPage, setLegalPage]         = useState(null); // 'privacy' | 'terms'

  if (legalPage === "privacy") return <PrivacyPolicy onBack={() => setLegalPage(null)} />;
  if (legalPage === "terms")   return <TermsOfService onBack={() => setLegalPage(null)} />;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await signInWithGoogle();
      // Pass referral code up so App.jsx can link it after profile creation
      if (user && onSignedIn) onSignedIn(user, referralInput.trim().toUpperCase());
    } catch (err) {
      setError(err.message || "Sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 24px", fontFamily: font
    }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>

        {/* Brand mark */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `${C.accent}18`, border: `2px solid ${C.accent}44`,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
          }}>
            <Shield size={32} color={C.accent} />
          </div>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>CAIIB Prep</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Sign in to sync your progress across devices.<br />
            Your SM-2 data, streak, and session are always saved.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {["📱 Multi-device sync", "☁️ Cloud backup", "🔔 Study reminders", "📊 Progress analytics"].map(f => (
            <span key={f} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: "5px 12px", fontSize: 11,
              color: C.muted, fontWeight: 500
            }}>{f}</span>
          ))}
        </div>

        {/* Optional referral code */}
        <div style={{ width: "100%", position: "relative" }}>
          <Tag size={14} color={C.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Referral code (optional)"
            value={referralInput}
            onChange={e => setReferralInput(e.target.value.toUpperCase())}
            maxLength={8}
            style={{
              width: "100%", background: C.card, border: `1.5px solid ${C.border}`,
              borderRadius: 12, padding: "13px 14px 13px 38px",
              color: C.text, fontSize: 13, fontFamily: "inherit",
              letterSpacing: "0.1em", outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Sign-in button */}
        {isConfigured ? (
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%", background: loading ? C.card : "#fff",
              border: `1.5px solid ${C.border}`, borderRadius: 14,
              padding: "14px 20px", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              opacity: loading ? 0.7 : 1, transition: "opacity 0.2s"
            }}>
            {/* Google logo */}
            {!loading && (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.8 5.4 2.9 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
                <path fill="#FBBC05" d="M10.7 28.7A14.5 14.5 0 0 1 9.5 24c0-1.7.3-3.3.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.6 2.5 10.9l8.2-6.2z"/>
                <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.3-9.9l-8.2 6.2C6.8 42.6 14.7 48 24 48z"/>
              </svg>
            )}
            <span style={{ color: "#111", fontWeight: 700, fontSize: 14 }}>
              {loading ? "Signing in…" : "Continue with Google"}
            </span>
          </button>
        ) : (
          <div style={{
            width: "100%", background: `${C.warn}12`,
            border: `1.5px solid ${C.warn}44`, borderRadius: 14, padding: "14px 16px",
            display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            <AlertTriangle size={16} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ color: C.warn, fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>Firebase not configured</p>
              <p style={{ color: C.muted, fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                Add your <code style={{ color: C.accent }}>VITE_FIREBASE_*</code> keys to <code style={{ color: C.accent }}>.env</code> and restart the dev server.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: C.err, fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>
        )}

        <p style={{ color: C.dim, fontSize: 10, textAlign: "center", margin: 0, lineHeight: 1.7 }}>
          By signing in you agree to our{" "}
          <button onClick={() => setLegalPage("privacy")} style={{ background: "none", border: "none", color: C.accent, fontSize: 10, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Privacy Policy</button>
          {" "}and{" "}
          <button onClick={() => setLegalPage("terms")} style={{ background: "none", border: "none", color: C.accent, fontSize: 10, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Terms of Service</button>.
          We only store your exam study data — never sold to third parties.
        </p>

      </div>
    </div>
  );
}
