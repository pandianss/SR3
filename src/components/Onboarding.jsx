import { useState } from "react";
import { User, Shield, BookOpen, Clock, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { C } from "../theme";

export default function Onboarding({ onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    role: "",
    experience: "",
    elective: "",
    studyHours: "",
    weakSubjects: [],
    strongSubjects: [],
    energyProfile: ""
  });

  const roles = [
    { id: "credit", name: "Credit / Loan Officer", desc: "Heavy focus on ABM Credit modules & MPBF" },
    { id: "treasury", name: "Treasury / Forex Operations", desc: "Heavy focus on BFM Treasury & exchange rates" },
    { id: "branch", name: "Retail Branch Manager", desc: "General banking & BRBL operations focus" },
    { id: "other", name: "Other Banking Roles", desc: "General learning and custom pacing" }
  ];

  const electives = [
    { id: "Risk", name: "Risk Management", desc: "Basel overrides, VaR, stress tests" },
    { id: "IT", name: "IT & Digital Banking", desc: "CBS security, digital payments, APIs" },
    { id: "HR", name: "Human Resource Management", desc: "PMS, industrial disputes, trade unions" },
    { id: "Rural", name: "Rural Banking", desc: "Priority sector, microfinance, rural economy" },
    { id: "Central", name: "Central Banking", desc: "Monetary policy, currency management, supervision" }
  ];

  const subjects = [
    { id: "ABM", name: "Advanced Bank Management (ABM)" },
    { id: "BFM", name: "Bank Financial Management (BFM)" },
    { id: "ABFM", name: "Adv. Business & Financial Mgmt (ABFM)" },
    { id: "BRBL", name: "Banking Regulations & Laws (BRBL)" }
  ];

  const energyProfiles = [
    { id: "commute", name: "Commute Reviewer", desc: "Short, micro-swipe sessions during travel" },
    { id: "night", name: "Night Owl Study", desc: "Deep numerical drills after bank hours" },
    { id: "morning", name: "Early Morning Focus", desc: "Highly retention-heavy reading and quizzes" }
  ];

  const toggleWeak = (id) => {
    setProfile(p => ({
      ...p,
      weakSubjects: p.weakSubjects.includes(id) 
        ? p.weakSubjects.filter(x => x !== id)
        : [...p.weakSubjects, id]
    }));
  };

  const toggleStrong = (id) => {
    setProfile(p => ({
      ...p,
      strongSubjects: p.strongSubjects.includes(id) 
        ? p.strongSubjects.filter(x => x !== id)
        : [...p.strongSubjects, id]
    }));
  };

  const canAdvance = () => {
    if (step === 1) return !!profile.role;
    if (step === 2) return !!profile.elective;
    if (step === 3) return !!profile.studyHours;
    if (step === 5) return !!profile.energyProfile;
    return true; // step 4 (subject assessment) is optional
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      const finalProfile = { ...profile, studyHours: profile.studyHours || "2" };
      localStorage.setItem("caiib_user_profile", JSON.stringify(finalProfile));
      localStorage.setItem("caiib_onboarded", "true");
      onComplete(finalProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, padding: "20px 24px" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= step ? C.accent : C.border,
            transition: "all 0.3s"
          }} />
        ))}
      </div>

      {/* Screen Title */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: C.accent, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          Step {step} of 5 · Diagnostic Onboarding
        </p>
        <h2 style={{ color: C.text, fontSize: 19, fontWeight: 700, marginTop: 4, marginBottom: 6 }}>
          {step === 1 && "What is your primary banking role?"}
          {step === 2 && "Select your CAIIB Elective paper"}
          {step === 3 && "Configure study time availability"}
          {step === 4 && "Subject Assessment"}
          {step === 5 && "Define your study energy profile"}
        </h2>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          {step === 1 && "We personalize your default subject expertise based on your job role."}
          {step === 2 && "All electives are supported. Pick yours to load formulas & circulars."}
          {step === 3 && "How much time can you realistically invest daily given bank pressure?"}
          {step === 4 && "Optional: tell us what feels weak or strong. You can skip and adjust later."}
          {step === 5 && "We customize content delivery based on your fatigue patterns."}
        </p>
        {!canAdvance() && (
          <p style={{ color: C.accent, fontSize: 11, margin: "8px 0 0", fontWeight: 600 }}>
            ↓ Select an option below to continue
          </p>
        )}
      </div>

      {/* Steps Content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        
        {/* Step 1: Role */}
        {step === 1 && roles.map(r => (
          <button key={r.id} onClick={() => setProfile({ ...profile, role: r.id })}
            style={{
              background: profile.role === r.id ? `${C.blue}15` : C.card,
              border: `1.5px solid ${profile.role === r.id ? C.blue : C.border}`,
              borderRadius: 14, padding: "14px 16px", cursor: "pointer",
              textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s"
            }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: profile.role === r.id ? `${C.blue}33` : `${C.dim}22`
            }}>
              <User size={18} color={profile.role === r.id ? C.blue : C.muted} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontWeight: 600, fontSize: 13, margin: 0 }}>{r.name}</p>
              <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>{r.desc}</p>
            </div>
          </button>
        ))}

        {/* Step 2: Electives */}
        {step === 2 && electives.map(e => (
          <button key={e.id} onClick={() => setProfile({ ...profile, elective: e.id })}
            style={{
              background: profile.elective === e.id ? `${C.purple}15` : C.card,
              border: `1.5px solid ${profile.elective === e.id ? C.purple : C.border}`,
              borderRadius: 14, padding: "14px 16px", cursor: "pointer",
              textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s"
            }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: profile.elective === e.id ? `${C.purple}33` : `${C.dim}22`
            }}>
              <Shield size={18} color={profile.elective === e.id ? C.purple : C.muted} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontWeight: 600, fontSize: 13, margin: 0 }}>{e.name}</p>
              <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>{e.desc}</p>
            </div>
          </button>
        ))}

        {/* Step 3: Hours */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 18, textAlign: "center" }}>
              <Clock size={36} color={C.accent} style={{ margin: "10px auto 14px" }} />
              {profile.studyHours ? (
                <p style={{ color: C.text, fontWeight: 700, fontSize: 26, margin: "0 0 14px" }}>
                  {profile.studyHours} hour{profile.studyHours !== "1" ? "s" : ""} / day
                </p>
              ) : (
                <p style={{ color: C.muted, fontWeight: 600, fontSize: 16, margin: "0 0 14px" }}>
                  How many hours can you commit daily?
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {["1", "1.5", "2", "2.5", "3", "3.5", "4"].map(h => (
                  <button key={h} onClick={() => setProfile({ ...profile, studyHours: h })}
                    style={{
                      background: profile.studyHours === h ? `${C.accent}22` : C.cardAlt,
                      border: `1.5px solid ${profile.studyHours === h ? C.accent : C.border}`,
                      borderRadius: 10, padding: "10px 16px", cursor: "pointer",
                      color: profile.studyHours === h ? C.accent : C.muted,
                      fontSize: 13, fontWeight: profile.studyHours === h ? 700 : 500,
                      minWidth: 60, minHeight: 44
                    }}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: `${C.warn}12`, border: `1px solid ${C.warn}33`, borderRadius: 12, padding: 12, display: "flex", gap: 10 }}>
              <AlertTriangle size={18} color={C.warn} style={{ flexShrink: 0 }} />
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                Consistency matters more than ambition. Most bankers clear CAIIB on 1.5–2h/day.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Subject Assessment */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Which subjects do you find difficult? (Select all)
            </p>
            {subjects.map(s => {
              const selected = profile.weakSubjects.includes(s.id);
              return (
                <button key={`w-${s.id}`} onClick={() => toggleWeak(s.id)}
                  style={{
                    background: selected ? `${C.err}15` : C.card,
                    border: `1.5px solid ${selected ? C.err : C.border}`,
                    borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                    textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                  <span style={{ color: selected ? C.err : C.text, fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                  {selected && <CheckCircle size={15} color={C.err} />}
                </button>
              );
            })}

            <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 8, margin: 0 }}>
              Which subjects are you comfortable with? (Select all that apply)
            </p>
            <p style={{ color: C.dim, fontSize: 11, margin: "4px 0 0", lineHeight: 1.4 }}>
              Subjects marked difficult above are grayed out here — a subject can only be one or the other.
            </p>
            {subjects.map(s => {
              const selected = profile.strongSubjects.includes(s.id);
              const disabled = profile.weakSubjects.includes(s.id);
              return (
                <button key={`s-${s.id}`} disabled={disabled} onClick={() => toggleStrong(s.id)}
                  style={{
                    background: selected ? `${C.ok}15` : C.card,
                    border: `1.5px solid ${selected ? C.ok : C.border}`,
                    borderRadius: 10, padding: "10px 14px", cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.3 : 1,
                    textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                    minHeight: 44
                  }}>
                  <span style={{ color: selected ? C.ok : C.text, fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                  {selected && <CheckCircle size={15} color={C.ok} />}
                  {disabled && <span style={{ color: C.dim, fontSize: 10 }}>marked difficult</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 5: Energy Profile */}
        {step === 5 && energyProfiles.map(ep => (
          <button key={ep.id} onClick={() => setProfile({ ...profile, energyProfile: ep.id })}
            style={{
              background: profile.energyProfile === ep.id ? `${C.teal}15` : C.card,
              border: `1.5px solid ${profile.energyProfile === ep.id ? C.teal : C.border}`,
              borderRadius: 14, padding: "14px 16px", cursor: "pointer",
              textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s"
            }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: profile.energyProfile === ep.id ? `${C.teal}33` : `${C.dim}22`
            }}>
              <Zap size={18} color={profile.energyProfile === ep.id ? C.teal : C.muted} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontWeight: 600, fontSize: 13, margin: 0 }}>{ep.name}</p>
              <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>{ep.desc}</p>
            </div>
          </button>
        ))}

      </div>

      {/* Nav Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={handleBack}
          aria-label={step === 1 ? "Back to sign in" : "Go to previous step"}
          style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "12px 20px", color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 600
          }}>
          ←
        </button>
        {step === 4 && (
          <button onClick={handleNext}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: "12px 16px", color: C.muted, cursor: "pointer", fontSize: 13, fontWeight: 600,
              whiteSpace: "nowrap"
            }}>
            Skip
          </button>
        )}
        <button onClick={handleNext}
          disabled={!canAdvance()}
          aria-label={step === 5 ? "Complete setup and start studying" : "Go to next step"}
          style={{
            flex: 1, background: C.accent, border: "none", borderRadius: 12,
            padding: "12px 20px", color: "#000", cursor: !canAdvance() ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 700, opacity: !canAdvance() ? 0.45 : 1
          }}>
          {step === 5 ? "Start My CAIIB Prep →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
