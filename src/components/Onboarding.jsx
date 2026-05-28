import { useState } from "react";
import { User, Shield, BookOpen, Clock, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { C } from "../theme";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    role: "",
    experience: "",
    elective: "Risk",
    studyHours: "2",
    weakSubjects: [],
    strongSubjects: [],
    energyProfile: "commute"
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

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      localStorage.setItem("caiib_user_profile", JSON.stringify(profile));
      localStorage.setItem("caiib_onboarded", "true");
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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
          {step === 4 && "Help us understand your strengths to focus effort where it matters."}
          {step === 5 && "We customize content delivery based on your fatigue patterns."}
        </p>
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
              <p style={{ color: C.text, fontWeight: 700, fontSize: 26, margin: 0 }}>
                {profile.studyHours} hour{profile.studyHours !== "1" ? "s" : ""} / day
              </p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 4, marginBottom: 14 }}>Suggested baseline for professionals is 2 hours</p>
              <input type="range" min="1" max="4" step="0.5" value={profile.studyHours}
                onChange={(e) => setProfile({ ...profile, studyHours: e.target.value })}
                style={{ width: "100%", accentColor: C.accent, cursor: "pointer" }} />
            </div>
            <div style={{ background: `${C.warn}12`, border: `1px solid ${C.warn}33`, borderRadius: 12, padding: 12, display: "flex", gap: 10 }}>
              <AlertTriangle size={18} color={C.warn} style={{ flexShrink: 0 }} />
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                A higher target increases your projected scores, but missing it frequently triggers burnout-warning sequences in the app.
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
              Which subjects are you comfortable with? (Select all)
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
                    textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                  <span style={{ color: selected ? C.ok : C.text, fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                  {selected && <CheckCircle size={15} color={C.ok} />}
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
        {step > 1 && (
          <button onClick={handleBack}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: "12px 20px", color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 600
            }}>
            Back
          </button>
        )}
        <button onClick={handleNext}
          disabled={step === 1 && !profile.role}
          style={{
            flex: 1, background: C.accent, border: "none", borderRadius: 12,
            padding: "12px 20px", color: "#000", cursor: (step === 1 && !profile.role) ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 700, opacity: (step === 1 && !profile.role) ? 0.5 : 1
          }}>
          {step === 5 ? "Assemble Engine →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
