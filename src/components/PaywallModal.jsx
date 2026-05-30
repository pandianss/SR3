import { useState } from "react";
import { X, Zap, Brain, BookOpen, Sparkles, CheckCircle2, Crown, TrendingUp } from "lucide-react";
import { C } from "../theme";
import { APP, SERIES } from "../brand";
import { PLANS, purchaseSubscription } from "../utils/subscription";

export default function PaywallModal({ onClose, trigger = "generic" }) {
  const [selectedPlan, setSelectedPlan] = useState("exam"); // 3-month is the hero
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const triggerMessages = {
    mode_deep:  { icon: "🧠", title: "Deep Focus is Premium", sub: "Unlock AI case studies, numerical scenarios & the exam-drill countdown timer." },
    mode_rapid: { icon: "⚡", title: "Rapid Revision is Premium", sub: "Unlock formula drills and your personalised weak-memory queue." },
    subject:    { icon: "📚", title: "This Subject is Premium", sub: "ABFM, BRBL and your Elective are on the Premium plan." },
    ai_coach:   { icon: "✨", title: "AI Coach is Premium", sub: "Get Gemini-powered explanations for every wrong answer." },
    card_limit: { icon: "🃏", title: "Daily Limit Reached", sub: "Free plan: 5 cards/day. Upgrade for unlimited daily practice." },
    generic:    { icon: "👑", title: "Unlock Full CAIIB Prep", sub: "Everything you need to clear CAIIB in one subscription." },
  };

  const msg = triggerMessages[trigger] || triggerMessages.generic;

  const features = [
    { Icon: Brain,        label: "Deep Focus Mode — AI case studies & timer drills" },
    { Icon: Zap,          label: "Rapid Revision Mode — formula drills & weak queue" },
    { Icon: BookOpen,     label: "All 4 papers + your chosen Elective" },
    { Icon: Sparkles,     label: "AI Coach — Gemini explanations for wrong answers" },
    { Icon: CheckCircle2, label: "Unlimited daily cards — no 5-card cap" },
    { Icon: TrendingUp,   label: "RBI circular tracker with AI summaries" },
    { Icon: Crown,        label: "Progress synced across all your devices" },
  ];

  // Per-month cost for display
  const perMonth = (plan) =>
    plan.months === 1 ? null : `₹${Math.round(plan.priceNum / plan.months)}/mo`;

  const handlePurchase = async () => {
    setLoading(true);
    setError("");
    const plan = PLANS[selectedPlan];
    const result = await purchaseSubscription(plan.productId);
    if (!result.success && result.reason !== "web_fallback") {
      setError("Purchase failed. Please try again or contact support@superrecall.in");
    }
    setLoading(false);
  };

  const activePlan = PLANS[selectedPlan];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)" }} />

      <div style={{
        position: "relative", width: "100%", maxWidth: 480,
        background: C.surf, borderRadius: "24px 24px 0 0",
        border: `1px solid ${C.border}`, borderBottom: "none",
        padding: "24px 20px 36px", zIndex: 1,
        maxHeight: "92vh", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 16,
      }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} color={C.muted} />
        </button>

        {/* Hero */}
        <div style={{ textAlign: "center", paddingRight: 36 }}>
          <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }}>{msg.icon}</div>
          <h2 style={{ color: C.text, fontSize: 19, fontWeight: 800, margin: "0 0 5px" }}>{msg.title}</h2>
          <p style={{ color: C.muted, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{msg.sub}</p>
        </div>

        {/* ROI nudge */}
        <div style={{ background: `${C.ok}12`, border: `1px solid ${C.ok}33`, borderRadius: 10, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>💰</span>
          <p style={{ color: C.ok, fontSize: 11, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            Passing CAIIB = ₹3,000–5,000/month increment. This subscription pays for itself in the first salary slip.
          </p>
        </div>

        {/* Plan selector — 3 cards */}
        <div style={{ display: "flex", gap: 8 }}>
          {Object.values(PLANS).map(plan => {
            const active = selectedPlan === plan.id;
            const pm = perMonth(plan);
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                style={{
                  flex: 1, position: "relative", cursor: "pointer",
                  background: active ? (plan.highlight ? `${C.accent}1A` : `${C.blue}1A`) : C.card,
                  border: `2px solid ${active ? (plan.highlight ? C.accent : C.blue) : C.border}`,
                  borderRadius: 14, padding: "14px 8px 10px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                {/* Badge */}
                {plan.badge && (
                  <span style={{
                    position: "absolute", top: -10,
                    background: plan.highlight ? C.accent : C.blue,
                    color: "#000", fontSize: 8, fontWeight: 800,
                    padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap"
                  }}>{plan.badge}</span>
                )}
                <span style={{ color: active ? (plan.highlight ? C.accent : C.blue) : C.muted, fontWeight: 700, fontSize: 10 }}>{plan.label}</span>
                <span style={{ color: active ? C.text : C.muted, fontWeight: 800, fontSize: 19 }}>{plan.price}</span>
                <span style={{ color: C.dim, fontSize: 9 }}>{plan.period}</span>
                {pm && <span style={{ color: active ? C.accent : C.dim, fontSize: 9, fontWeight: 600, marginTop: 2 }}>{pm}</span>}
              </button>
            );
          })}
        </div>

        {/* Feature list — compact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {features.map(({ Icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <CheckCircle2 size={13} color={C.ok} style={{ flexShrink: 0 }} />
              <span style={{ color: C.text, fontSize: 11.5 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={handlePurchase} disabled={loading}
          style={{
            background: loading ? C.card : C.accent, border: "none",
            borderRadius: 14, padding: "15px 20px", cursor: loading ? "not-allowed" : "pointer",
            color: loading ? C.dim : "#000", fontSize: 14, fontWeight: 800,
            opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
          }}>
          {loading
            ? "Processing…"
            : `Start ${activePlan.label} — ${activePlan.price} ${activePlan.period}`}
        </button>

        {/* Refund note */}
        <p style={{ color: C.dim, fontSize: 10, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          Billed via Google Play · Cancel anytime in Play Store → Subscriptions<br />
          {SERIES.name} · {APP.name} · Not affiliated with IIBF
        </p>

        {error && <p style={{ color: C.err, fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>}
      </div>
    </div>
  );
}
