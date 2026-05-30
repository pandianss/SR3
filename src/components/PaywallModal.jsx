import { useState } from "react";
import { X, Zap, Brain, BookOpen, Sparkles, CheckCircle2, Crown } from "lucide-react";
import { C } from "../theme";
import { PLANS, purchaseSubscription } from "../utils/subscription";

export default function PaywallModal({ onClose, trigger = "generic" }) {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const triggerMessages = {
    mode_deep:    { icon: "🧠", title: "Deep Focus is Premium", sub: "Unlock numerical scenarios, AI case studies, and the countdown drill timer." },
    mode_rapid:   { icon: "⚡", title: "Rapid Revision is Premium", sub: "Unlock formula drills and the weak memory queue." },
    subject:      { icon: "📚", title: "This Subject is Premium", sub: "ABFM, BRBL and Electives are available on the Premium plan." },
    ai_coach:     { icon: "✨", title: "AI Coach is Premium", sub: "Get personalised explanations for every wrong answer." },
    card_limit:   { icon: "🃏", title: "Daily Limit Reached", sub: "Free users study up to 5 cards/day. Upgrade for unlimited." },
    generic:      { icon: "👑", title: "Upgrade to Premium", sub: "Unlock the full CAIIB Prep experience." },
  };

  const msg = triggerMessages[trigger] || triggerMessages.generic;

  const features = [
    { Icon: Brain,      label: "Deep Focus Mode — AI case studies & timer drills" },
    { Icon: Zap,        label: "Rapid Revision Mode — formula drills & weak queue" },
    { Icon: BookOpen,   label: "All 4 subjects + your chosen Elective" },
    { Icon: Sparkles,   label: "AI Coach explanations for wrong answers" },
    { Icon: CheckCircle2, label: "Unlimited daily cards" },
    { Icon: Crown,      label: "Progress sync across devices" },
  ];

  const handlePurchase = async () => {
    setLoading(true);
    setError("");
    const plan = PLANS[selectedPlan];
    const result = await purchaseSubscription(plan.productId);
    if (!result.success && result.reason !== "web_fallback") {
      setError("Purchase failed. Please try again or contact support.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} />

      <div style={{
        position: "relative", width: "100%", maxWidth: 480,
        background: C.surf, borderRadius: "24px 24px 0 0",
        border: `1px solid ${C.border}`, borderBottom: "none",
        padding: "24px 20px 36px", display: "flex", flexDirection: "column", gap: 18, zIndex: 1,
        maxHeight: "90vh", overflowY: "auto"
      }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} color={C.muted} />
        </button>

        {/* Hero */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 10 }}>{msg.icon}</div>
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>{msg.title}</h2>
          <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{msg.sub}</p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {features.map(({ Icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={14} color={C.accent} />
              </div>
              <span style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div style={{ display: "flex", gap: 8 }}>
          {Object.values(PLANS).map(plan => {
            const active = selectedPlan === plan.id;
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                style={{
                  flex: 1, background: active ? `${C.accent}18` : C.card,
                  border: `2px solid ${active ? C.accent : C.border}`,
                  borderRadius: 14, padding: "12px 10px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative"
                }}>
                {plan.savings && (
                  <span style={{ position: "absolute", top: -10, background: C.accent, color: "#000", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
                    {plan.savings}
                  </span>
                )}
                <span style={{ color: active ? C.accent : C.muted, fontWeight: 700, fontSize: 11 }}>{plan.label}</span>
                <span style={{ color: active ? C.text : C.muted, fontWeight: 800, fontSize: 20 }}>{plan.price}</span>
                <span style={{ color: C.dim, fontSize: 10 }}>{plan.period}</span>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button onClick={handlePurchase} disabled={loading}
          style={{
            background: loading ? C.card : C.accent, border: "none",
            borderRadius: 14, padding: "15px 20px", cursor: loading ? "not-allowed" : "pointer",
            color: loading ? C.dim : "#000", fontSize: 15, fontWeight: 800,
            opacity: loading ? 0.7 : 1
          }}>
          {loading ? "Processing…" : `Start Premium — ${PLANS[selectedPlan].price}${PLANS[selectedPlan].period}`}
        </button>

        {error && <p style={{ color: C.err, fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>}

        <p style={{ color: C.dim, fontSize: 10, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          Billed via Google Play · Cancel anytime in Play Store → Subscriptions<br />
          Exam prep only — not affiliated with IIBF
        </p>
      </div>
    </div>
  );
}
