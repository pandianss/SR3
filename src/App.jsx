import { useState, useEffect } from "react";
import {
  BookOpen, Brain, Zap, Clock, TrendingUp, Home,
  BarChart2, FlaskConical, Play, AlertTriangle,
  RotateCcw, Target, Battery, ChevronRight, Star,
  BookMarked, Shield, FileText, RefreshCw, WifiOff,
  Settings, X, KeyRound, CheckCircle2, ServerCrash,
  LogOut, User, PenLine
} from "lucide-react";

import { SUBJECTS, ELECTIVES, MODULES, TOPICS, MICRO_LESSONS, FORMULAS, RBI_CIRCULARS } from "./data/contentGraph";
import { getAllCardStates, seedMockSpacedRepetitionData, getMemoryStrengthStats, saveSessionCheckpoint, loadSessionCheckpoint, clearSessionCheckpoint } from "./utils/spacedRepetition";
import { calculatePassProbability } from "./utils/aiOrchestrator";
import { C, font } from "./theme";
import { checkServerApiStatus } from "./utils/keyStore";
import { subscribeToAuthState, signOutUser, isConfigured } from "./utils/firebase";
import { APP, SERIES } from "./brand";
import { syncRead, syncWrite } from "./utils/syncStore";
import { generateReferralCode, registerReferralCode, linkReferral, getReferralStats } from "./utils/referral";
import { loadSubscriptionStatus, canUseMode, canStudySubject, FREE_SUBJECTS, FREE_DAILY_CARD_LIMIT } from "./utils/subscription";
import { requestPushPermission, scheduleDailyReminder } from "./utils/notifications";
import PaywallModal from "./components/PaywallModal";

// Component imports
import Onboarding from "./components/Onboarding";
import AuthScreen from "./components/AuthScreen";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import StudyPanel from "./components/StudyPanel";
import RevisionInbox from "./components/RevisionInbox";
import PassOptimizer from "./components/PassOptimizer";
import Circulars from "./components/Circulars";
import PracticeQuiz from "./components/PracticeQuiz";

export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  // null = not yet resolved, false = signed out, object = Firebase user
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);

  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [tab, setTab] = useState("home");

  // Study session states
  const [sessionQueue, setSessionQueue] = useState([]);
  const [energyMode, setEnergyMode] = useState("low");

  // Offline sync indicator states
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");
  const [dbSize, setDbSize] = useState("14 KB");

  // Settings drawer
  const [showSettings, setShowSettings] = useState(false);

  // AI backend status — 'checking' | 'active' | 'missing' | 'error' | 'offline'
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    checkServerApiStatus().then(setApiStatus);
  }, []);

  // Active Subject selection
  const [activeSubject, setActiveSubject] = useState("BFM");
  const [expandedModule, setExpandedModule] = useState("BFM-B");
  const [selectedFormulaTab, setSelectedFormulaTab] = useState("All");

  // Checkpoint for mid-session resume
  const [checkpoint, setCheckpoint] = useState(null);
  const [resumeIndex, setResumeIndex] = useState(0);

  // Referral
  const [referralStats, setReferralStats] = useState(null);

  // Subscription
  const [isPremium, setIsPremium] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState(null); // null = closed
  const [dailyCardCount, setDailyCardCount] = useState(() => {
    const saved = localStorage.getItem("caiib_daily_cards");
    if (!saved) return 0;
    const { date, count } = JSON.parse(saved);
    return date === new Date().toDateString() ? count : 0;
  });

  // ── Bootstrap: auth listener + cloud sync ──────────────────────────────────
  useEffect(() => {
    seedMockSpacedRepetitionData(MICRO_LESSONS, FORMULAS);

    const unsub = subscribeToAuthState(async (user) => {
      setFirebaseUser(user);
      setAuthResolved(true);

      const uid = user?.uid ?? null;

      // Load profile — prefer Firestore, fall back to localStorage
      const profile = await syncRead(uid, "profile", "caiib_user_profile");
      if (profile) {
        setUserProfile(profile);
        setIsOnboarded(true);

        // Load referral stats if user has a code
        if (profile.referralCode) {
          getReferralStats(uid, profile.referralCode).then(setReferralStats);
        }

        // Load subscription status
        loadSubscriptionStatus(uid).then(s => setIsPremium(s.isPremium));
      } else {
        const onboarded = localStorage.getItem("caiib_onboarded") === "true";
        if (onboarded) {
          setIsOnboarded(true);
          const local = localStorage.getItem("caiib_user_profile");
          if (local) setUserProfile(JSON.parse(local));
        }
      }

      // Restore checkpoint
      const saved = loadSessionCheckpoint();
      if (saved) setCheckpoint(saved);
    });

    return unsub;
  }, []);

  // Called by AuthScreen after Google sign-in — stores pending referral code
  const [pendingReferralCode, setPendingReferralCode] = useState("");
  const handleSignedIn = (_user, referralCode) => {
    if (referralCode) setPendingReferralCode(referralCode);
    // onAuthStateChanged fires automatically and drives the rest of the flow
  };

  const handleOnboardingComplete = async (profile) => {
    const uid = firebaseUser?.uid ?? null;

    // Generate a referral code for this user on first onboarding
    let referralCode = profile.referralCode;
    if (!referralCode && uid) {
      referralCode = await generateReferralCode(firebaseUser?.displayName || "");
      await registerReferralCode(uid, referralCode);
    }

    const enrichedProfile = { ...profile, referralCode };
    setUserProfile(enrichedProfile);
    setIsOnboarded(true);
    const profileToMode = { commute: "low", night: "focus", morning: "rapid" };
    setEnergyMode(profileToMode[profile.energyProfile] || "low");

    // Persist enriched profile
    syncWrite(uid, "profile", "caiib_user_profile", enrichedProfile);

    // Link referral if one was entered at sign-in
    if (pendingReferralCode && uid) {
      const linked = await linkReferral(uid, pendingReferralCode);
      if (linked) setPendingReferralCode("");
    }

    // Load referral stats
    if (referralCode && uid) {
      getReferralStats(uid, referralCode).then(setReferralStats);
    }

    // Request push permission after onboarding (non-blocking)
    requestPushPermission(uid).then(granted => {
      if (granted) scheduleDailyReminder(0);
    });

    setTab("home");
  };

  const handleStartStudySession = (queue, mode = "low", startIndex = 0) => {
    setSessionQueue(queue);
    setEnergyMode(mode);
    setTab("study_session");
    saveSessionCheckpoint({ subjectId: activeSubject, energyMode: mode, queueIds: queue.map(l => l.id), currentIndex: startIndex });
    setCheckpoint(null); // consumed
  };

  const handleLaunchTopicLesson = (topicId) => {
    const lesson = MICRO_LESSONS.find(l => l.topicId === topicId);
    if (lesson) {
      handleStartStudySession([lesson], energyMode);
    } else {
      const allTopics = Object.values(TOPICS).flat();
      const topic = allTopics.find(t => t.id === topicId);
      const dummyLesson = {
        id: `L-${topicId}`, topicId, subjectId: activeSubject,
        title: topic?.name || "Syllabus Unit",
        badge: "Auto Generated",
        steps: [
          { kind: "concept", title: "Core Concept", body: "This unit covers specialized regulations, compliance benchmarks, and reporting standards under CAIIB statutory guidelines.", highlight: "Review linked RBI master directives for circular overlaps." },
          { kind: "pillars", title: "Regulatory Pillars", pillars: [{ e: "📑", n: "Pillar A", d: "Standard operational audits & reporting guidelines." }, { e: "🛡️", n: "Pillar B", d: "Supervisory risk indicators and reserve ratios." }] }
        ]
      };
      handleStartStudySession([dummyLesson], energyMode);
    }
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
      const len = JSON.stringify(localStorage).length;
      setDbSize(`${(len / 1024).toFixed(1)} KB`);
    }, 800);
  };

  const handleResetApp = () => {
    if (confirm("Reset onboarding and all progress states?")) {
      localStorage.clear();
      setIsOnboarded(false);
      setUserProfile(null);
      setTab("home");
      setApiStatus("disconnected");
      setSessionQueue([]);
      setEnergyMode("low");
      setShowSettings(false);
    }
  };

  const passStats = calculatePassProbability(userProfile, 0);

  const roleLabel = userProfile?.role === "credit" ? "Credit Officer"
    : userProfile?.role === "treasury" ? "Treasury Officer"
    : userProfile?.role === "branch" ? "Branch Manager"
    : "Banker";

  // ── Auth gate ───────────────────────────────────────────────────────────────
  // Show loading spinner until Firebase resolves auth state
  if (!authResolved) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", width: 32, height: 32, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show auth screen if Firebase is configured and user is not signed in
  if (isConfigured && !firebaseUser) {
    return <AuthScreen onSignedIn={handleSignedIn} />;
  }

  return (
    <div style={{ fontFamily: font, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1B3454; border-radius: 99px; }
        button { font-family: inherit; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-animate { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* App Shell — max width keeps it comfortable on desktop */}
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh", display: "flex", flexDirection: "column", background: C.surf, position: "relative" }}>

        {/* ── Top App Bar ── */}
        {isOnboarded && !["study_session", "session_complete", "privacy", "terms"].includes(tab) && (
          <div style={{
            background: C.surf, borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", flexShrink: 0, position: "sticky", top: 0, zIndex: 20
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} color={C.accent} />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                <span style={{ color: C.dim, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{SERIES.name}</span>
                <span style={{ color: C.accent, fontWeight: 800, fontSize: 13, letterSpacing: "0.04em" }}>{APP.exam}</span>
              </div>
              <span style={{ color: C.muted, fontSize: 12, fontWeight: 500 }}>· {tab === "home" ? "Dashboard" : tab === "study" ? "Explore" : tab === "practice" ? "Practice" : tab === "revision" ? "Inbox" : tab === "strategy" ? "Strategy" : "Circulars"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Sync status */}
              <button onClick={handleTriggerSync} disabled={isSyncing}
                style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, color: C.muted, fontSize: 10, cursor: "pointer", padding: 0 }}>
                <RefreshCw size={12} className={isSyncing ? "spin-animate" : ""} color={C.teal} />
                <span style={{ color: C.teal, fontSize: 10, fontWeight: 600 }}>{isSyncing ? "Syncing…" : `Sync: ${lastSyncTime}`}</span>
              </button>
              {/* Settings */}
              <button onClick={() => setShowSettings(true)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Settings size={15} color={C.muted} />
              </button>
            </div>
          </div>
        )}

        {/* ── Settings Drawer ── */}
        {showSettings && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {/* Backdrop */}
            <div onClick={() => setShowSettings(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
            <div style={{
              position: "relative", width: "100%", maxWidth: 480,
              background: C.surf, borderRadius: "20px 20px 0 0",
              border: `1px solid ${C.border}`, borderBottom: "none",
              padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 16, zIndex: 1
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Settings</span>
                <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                  <X size={20} />
                </button>
              </div>

              {/* Account info */}
              {firebaseUser ? (
                <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  {firebaseUser.photoURL
                    ? <img src={firebaseUser.photoURL} alt="avatar" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={18} color={C.accent} /></div>
                  }
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <p style={{ color: C.text, fontWeight: 600, fontSize: 13, margin: 0, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{firebaseUser.displayName || "Signed in"}</p>
                    <p style={{ color: C.muted, fontSize: 11, margin: 0, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{firebaseUser.email}</p>
                  </div>
                  <button onClick={() => { signOutUser(); setFirebaseUser(null); }}
                    style={{ background: `${C.err}18`, border: `1px solid ${C.err}44`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: C.err, fontSize: 11, fontWeight: 600 }}>
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              ) : (
                <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <User size={16} color={C.dim} />
                  <span style={{ color: C.muted, fontSize: 12, flex: 1 }}>Offline mode — progress stored locally only</span>
                  <button onClick={() => setShowSettings(false)}
                    style={{ background: C.accent, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: 11, fontWeight: 700 }}>
                    Sign in
                  </button>
                </div>
              )}

              {/* AI Features — server-managed key status */}
              <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <KeyRound size={14} color={C.accent} />
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>AI Features</span>
                  <div style={{
                    marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
                    background: apiStatus === "active" ? C.ok : apiStatus === "checking" ? C.warn : apiStatus === "offline" ? C.dim : C.err
                  }} />
                  <span style={{ fontSize: 10, color: C.muted }}>
                    {apiStatus === "active" ? "Live" : apiStatus === "checking" ? "Checking…" : apiStatus === "missing" ? "Key missing" : apiStatus === "offline" ? "Server offline" : "Error"}
                  </span>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: apiStatus === "active" ? `${C.ok}15` : apiStatus === "offline" ? `${C.warn}15` : `${C.err}15`,
                  border: `1px solid ${apiStatus === "active" ? `${C.ok}44` : apiStatus === "offline" ? `${C.warn}44` : `${C.err}44`}`,
                  borderRadius: 8, padding: "8px 12px"
                }}>
                  {apiStatus === "active"
                    ? <CheckCircle2 size={13} color={C.ok} />
                    : apiStatus === "offline"
                      ? <WifiOff size={13} color={C.warn} />
                      : <ServerCrash size={13} color={C.err} />}
                  <span style={{ fontSize: 11, fontWeight: 600, color: apiStatus === "active" ? C.ok : apiStatus === "offline" ? C.warn : C.err }}>
                    {apiStatus === "active"
                      ? "Backend connected · Gemini API key active"
                      : apiStatus === "offline"
                        ? "Backend server not running"
                        : apiStatus === "missing"
                          ? "GEMINI_API_KEY not set in server .env"
                          : "Could not reach Gemini API"}
                  </span>
                </div>

                <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>
                  The API key lives exclusively in the server .env file — it is never sent to the browser. Start the server with <code style={{ color: C.accent, fontSize: 10 }}>npm run server</code> to enable AI case studies, coaching, and strategic advice.
                </p>

                <button
                  onClick={() => { setApiStatus("checking"); checkServerApiStatus().then(setApiStatus); }}
                  style={{
                    background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: "7px 12px", color: C.muted, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", alignSelf: "flex-start"
                  }}>
                  Re-check connection
                </button>
              </div>

              {/* Referral programme */}
              {userProfile?.referralCode && (
                <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <BookMarked size={14} color={C.accent} />
                    <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Your Referral Code</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: C.teal, fontWeight: 600 }}>15% commission</span>
                  </div>

                  {/* Code pill + copy */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, background: C.cardAlt, border: `1.5px solid ${C.accent}44`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ color: C.accent, fontWeight: 800, fontSize: 20, letterSpacing: "0.18em", fontFamily: "monospace" }}>
                        {userProfile.referralCode}
                      </span>
                    </div>
                    <button onClick={() => {
                      navigator.clipboard.writeText(userProfile.referralCode);
                    }} style={{ background: C.accent, border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", color: "#000", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      Copy
                    </button>
                  </div>

                  {/* Share message */}
                  <button onClick={() => {
                    const msg = `📚 I'm using CAIIB Prep for my exam — use my code ${userProfile.referralCode} to sign up! https://play.google.com/store/apps/details?id=com.superrecall.caiib`;
                    if (navigator.share) {
                      navigator.share({ title: "CAIIB Prep", text: msg });
                    } else {
                      navigator.clipboard.writeText(msg);
                    }
                  }} style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", cursor: "pointer", color: C.text, fontSize: 12, fontWeight: 600 }}>
                    📤 Share & Earn
                  </button>

                  {/* Stats */}
                  {referralStats && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { label: "Referred", value: referralStats.totalReferred },
                        { label: "Earned", value: `₹${referralStats.totalCommissionEarned.toFixed(0)}` },
                        { label: "Pending payout", value: `₹${referralStats.unpaidCommission.toFixed(0)}` },
                      ].map(s => (
                        <div key={s.label} style={{ flex: 1, background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                          <p style={{ color: C.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{s.value}</p>
                          <p style={{ color: C.muted, fontSize: 9, margin: "2px 0 0", textTransform: "uppercase" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p style={{ color: C.dim, fontSize: 10, margin: 0, lineHeight: 1.5 }}>
                    You earn 15% of every purchase made by users who sign up with your code. Payouts via UPI — contact support once your balance exceeds ₹100.
                  </p>
                </div>
              )}

              {/* DB info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                <span style={{ color: C.muted, fontSize: 12 }}>Local DB size</span>
                <span style={{ color: C.text, fontWeight: 600, fontSize: 12 }}>{dbSize}</span>
              </div>

              {/* Legal */}
              <div style={{ display: "flex", gap: 8 }}>
                {[["Privacy Policy", "privacy"], ["Terms of Service", "terms"]].map(([label, page]) => (
                  <button key={page} onClick={() => { setShowSettings(false); setTab(page); }}
                    style={{ flex: 1, background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 10px", cursor: "pointer", color: C.muted, fontSize: 11, fontWeight: 600 }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Reset */}
              <button onClick={handleResetApp}
                style={{
                  background: `${C.err}18`, border: `1.5px solid ${C.err}44`, color: C.err,
                  borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700
                }}>
                Reset All Progress & Onboarding
              </button>
            </div>
          </div>
        )}

        {/* ── Server-offline banner — shown when AI backend is unreachable ── */}
        {isOnboarded && tab !== "study_session" && apiStatus === "offline" && (
          <div style={{
            background: `${C.warn}18`, border: `1px solid ${C.warn}44`,
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0
          }}>
            <WifiOff size={13} color={C.warn} />
            <span style={{ color: C.warn, fontSize: 11, fontWeight: 600 }}>
              AI features unavailable — backend server is offline.
            </span>
            <span style={{ color: C.muted, fontSize: 11, marginLeft: 2 }}>
              Run: <code style={{ color: C.accent, fontSize: 10 }}>npm run server</code>
            </span>
          </div>
        )}

        {/* ── Active Screen Area ── */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {!isOnboarded ? (
            <Onboarding onComplete={handleOnboardingComplete} />
          ) : (
            <>
              {/* HOME SCREEN */}
              {tab === "home" && (
                <div style={{ height: "100%", overflowY: "auto", padding: "20px 20px 0" }}>
                  {/* Greeting */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>
                      Welcome back, {roleLabel} 👋
                    </p>
                    <h1 style={{ color: C.text, fontSize: 22, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
                      {APP.exam} Preparation
                    </h1>
                    <p style={{ color: C.accent, fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                      🎯 Target Elective: {userProfile?.elective ? ELECTIVES.find(e => e.id === userProfile.elective)?.name : "Risk Management"}
                    </p>
                  </div>

                  {/* Free tier usage bar */}
                  {!isPremium && (
                    <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Daily cards used</span>
                          <span style={{ color: dailyCardCount >= FREE_DAILY_CARD_LIMIT ? C.err : C.text, fontSize: 11, fontWeight: 700 }}>
                            {dailyCardCount} / {FREE_DAILY_CARD_LIMIT}
                          </span>
                        </div>
                        <div style={{ height: 4, background: C.border, borderRadius: 99 }}>
                          <div style={{ height: 4, borderRadius: 99, background: dailyCardCount >= FREE_DAILY_CARD_LIMIT ? C.err : C.accent, width: `${Math.min(100, (dailyCardCount / FREE_DAILY_CARD_LIMIT) * 100)}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                      <button onClick={() => setPaywallTrigger("generic")}
                        style={{ background: C.accent, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#000", fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>
                        👑 ₹349
                      </button>
                    </div>
                  )}

                  {/* Resume Banner — shown when a mid-session checkpoint exists */}
                  {checkpoint && (
                    <div style={{
                      background: `${C.teal}12`, border: `1.5px solid ${C.teal}44`,
                      borderRadius: 14, padding: "12px 14px", marginBottom: 16,
                      display: "flex", alignItems: "center", gap: 12
                    }}>
                      <BookMarked size={18} color={C.teal} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: C.teal, fontSize: 11, fontWeight: 700, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session saved</p>
                        <p style={{ color: C.text, fontSize: 12, margin: 0 }}>
                          {checkpoint.subjectId} · Card {checkpoint.currentIndex + 1} of {checkpoint.queueIds.length}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => {
                          const allItems = [...MICRO_LESSONS, ...FORMULAS];
                          const queue = checkpoint.queueIds.map(id => allItems.find(l => l.id === id)).filter(Boolean);
                          if (queue.length) {
                            setActiveSubject(checkpoint.subjectId);
                            setEnergyMode(checkpoint.energyMode);
                            setSessionQueue(queue);
                            setTab("study_session");
                            // Pass startIndex via StudyPanel initialIndex prop
                            setResumeIndex(checkpoint.currentIndex);
                            clearSessionCheckpoint();
                            setCheckpoint(null);
                          }
                        }} style={{ background: C.teal, border: "none", borderRadius: 8, padding: "6px 12px", color: "#000", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          Resume →
                        </button>
                        <button onClick={() => { clearSessionCheckpoint(); setCheckpoint(null); }}
                          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.muted, fontSize: 11, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subject Picker */}
                  <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Study Subject
                  </p>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, flexShrink: 0, marginBottom: 16 }}>
                    {SUBJECTS.concat(ELECTIVES).map(s => {
                      const locked = !canStudySubject(s.id, isPremium);
                      const active = activeSubject === s.id;
                      return (
                        <button key={s.id} onClick={() => locked ? setPaywallTrigger("subject") : setActiveSubject(s.id)}
                          style={{
                            background: active ? s.color : C.card,
                            border: `1.5px solid ${active ? s.color : C.border}`,
                            borderRadius: 8, padding: "6px 14px",
                            color: active ? "#000" : locked ? C.dim : C.muted,
                            fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                            opacity: locked ? 0.6 : 1
                          }}>
                          {s.label} {locked ? "🔒" : ""}
                        </button>
                      );
                    })}
                  </div>

                  {/* Study Modes Panel */}
                  <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Select Study Mode
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {[
                      { id: "low", Icon: Battery, label: "Low Energy Mode", sub: "Audio cards · One-handed swipe review", color: C.teal, bg: "#071E1C", mins: "5–10 min" },
                      { id: "focus", Icon: Brain, label: "Deep Focus Mode", sub: "Numerical scenarios · Solved cases · Calculator", color: C.blue, bg: "#081830", mins: "20–40 min" },
                      { id: "rapid", Icon: Zap, label: "Rapid Revision Mode", sub: "Formula drills · Weak memory queue", color: C.accent, bg: "#1E1505", mins: "10–15 min" }
                    ].map(m => {
                      const active = energyMode === m.id;
                      const locked = !canUseMode(m.id, isPremium);
                      return (
                        <button key={m.id} onClick={() => locked ? setPaywallTrigger(`mode_${m.id === "focus" ? "deep" : "rapid"}`) : setEnergyMode(m.id)}
                          style={{
                            background: active ? m.bg : C.card,
                            border: `1.5px solid ${active ? m.color : C.border}`,
                            borderRadius: 12, padding: "12px 14px", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all 0.2s"
                          }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${m.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <m.Icon size={18} color={locked ? C.dim : m.color} />
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <p style={{ color: locked ? C.dim : C.text, fontWeight: 600, fontSize: 13, margin: 0 }}>{m.label} {locked && <span style={{ fontSize: 10 }}>🔒</span>}</p>
                            <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{locked ? "Premium only" : m.sub}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ color: locked ? C.dim : m.color, fontSize: 11, fontWeight: 600 }}>{locked ? "Upgrade" : m.mins}</span>
                            {active && (
                              <div style={{ marginTop: 4 }}>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isPremium && dailyCardCount >= FREE_DAILY_CARD_LIMIT) {
                                    setPaywallTrigger("card_limit"); return;
                                  }
                                  const list = MICRO_LESSONS.filter(l => l.subjectId === activeSubject);
                                  handleStartStudySession(list.length > 0 ? list : MICRO_LESSONS, m.id);
                                }}
                                  style={{ background: m.color, border: "none", borderRadius: 6, color: "#000", fontSize: 10, fontWeight: 700, padding: "3px 8px", cursor: "pointer" }}>
                                  Start →
                                </button>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Continue Study Block — reflects active subject */}
                  {(() => {
                    const subjectLessons = MICRO_LESSONS.filter(l => l.subjectId === activeSubject);
                    const nextLesson = subjectLessons[0];
                    const subjectMeta = SUBJECTS.concat(ELECTIVES).find(s => s.id === activeSubject);
                    const firstModule = (MODULES[activeSubject] || [])[0];
                    if (!nextLesson) return null;
                    return (
                      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1, overflow: "hidden", marginRight: 12 }}>
                            <span style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>UP NEXT · {subjectMeta?.label || activeSubject}</span>
                            <h4 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: "2px 0", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{nextLesson.title}</h4>
                            <span style={{ fontSize: 9, background: `${subjectMeta?.color || C.blue}20`, color: subjectMeta?.color || C.blue, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                              {activeSubject} · {firstModule?.name?.replace(/Module [A-Z]: /, "") || "Module A"}
                            </span>
                          </div>
                          <button onClick={() => handleLaunchTopicLesson(nextLesson.topicId)}
                            style={{ background: C.accent, border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Play size={16} color="#000" fill="#000" style={{ marginLeft: 2 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pass Probability Snapshot */}
                  <div onClick={() => setTab("strategy")}
                    style={{
                      background: `${C.accent}12`, border: `1.5px solid ${C.accent}44`, borderRadius: 14,
                      padding: 14, marginBottom: 24, cursor: "pointer", display: "flex", alignItems: "center", gap: 12
                    }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.accent, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Pass Probability Indicator</p>
                      <p style={{ color: C.text, fontSize: 20, fontWeight: 800, margin: "2px 0" }}>
                        {passStats.probability}% <span style={{ color: passStats.statusColor, fontSize: 11, fontWeight: 600 }}>{passStats.statusText}</span>
                      </p>
                      <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Projected Aggregate {passStats.aggregate}/100 · Open Optimizer →</p>
                    </div>
                    <ChevronRight size={18} color={C.accent} />
                  </div>
                </div>
              )}

              {/* TRAVERSABLE SYLLABUS MAP SCREEN */}
              {tab === "study" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "20px 20px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Syllabus Explorer</h2>
                  </div>

                  {/* Subject Pickers */}
                  <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 10, flexShrink: 0 }}>
                    {SUBJECTS.concat(ELECTIVES).map(s => (
                      <button key={s.id} onClick={() => { setActiveSubject(s.id); setExpandedModule(`${s.id}-A`); }}
                        style={{
                          background: activeSubject === s.id ? s.color : C.card,
                          border: `1.5px solid ${activeSubject === s.id ? s.color : C.border}`,
                          borderRadius: 8, padding: "6px 12px", color: activeSubject === s.id ? "#000" : C.muted,
                          fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Module List & Topic Tree */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
                    {(MODULES[activeSubject] || []).map(m => {
                      const isExpanded = expandedModule === m.id;
                      const topics = TOPICS[m.id] || [];
                      return (
                        <div key={m.id} style={{ background: C.card, border: `1.5px solid ${isExpanded ? C.border : "transparent"}`, borderRadius: 12, overflow: "hidden" }}>
                          <button onClick={() => setExpandedModule(isExpanded ? null : m.id)}
                            style={{ width: "100%", background: "none", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                            <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{m.name}</span>
                            <span style={{ color: C.muted, fontSize: 11 }}>{isExpanded ? "▲" : "▼"}</span>
                          </button>
                          {isExpanded && (
                            <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                              {topics.length === 0 ? (
                                <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>No topics configured yet.</p>
                              ) : (
                                topics.map(t => (
                                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
                                    <div style={{ overflow: "hidden", flex: 1 }}>
                                      <p style={{ color: C.text, fontSize: 12, fontWeight: 600, margin: 0, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{t.name}</p>
                                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: t.weightage === "Critical" ? C.err : t.weightage === "High" ? C.warn : C.teal }}>{t.weightage} Weight</span>
                                        {t.dependency.length > 0 && (
                                          <span style={{ color: C.muted, fontSize: 9 }}>· Requires {t.dependency[0].replace("T-", "")}</span>
                                        )}
                                      </div>
                                    </div>
                                    <button onClick={() => handleLaunchTopicLesson(t.id)}
                                      style={{ background: C.accent, border: "none", borderRadius: 6, padding: "4px 10px", color: "#000", fontSize: 10, fontWeight: 700, cursor: "pointer", marginLeft: 10, flexShrink: 0 }}>
                                      Study
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Formula sheet quick index */}
                    <div style={{ marginTop: 10, borderTop: `1.5px solid ${C.border}`, paddingTop: 14 }}>
                      <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>Formula Revision Index</p>
                      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                        {["All", "BFM", "ABM", "ABFM"].map(f => (
                          <button key={f} onClick={() => setSelectedFormulaTab(f)}
                            style={{
                              background: selectedFormulaTab === f ? C.accent : C.card,
                              border: `1px solid ${selectedFormulaTab === f ? C.accent : C.border}`,
                              borderRadius: 6, padding: "4px 8px", color: selectedFormulaTab === f ? "#000" : C.muted,
                              fontSize: 10, fontWeight: 600, cursor: "pointer"
                            }}>
                            {f}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {FORMULAS.filter(f => selectedFormulaTab === "All" || f.sub === selectedFormulaTab).map(f => (
                          <div key={f.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: C.teal }}>{f.sub} · {f.tag}</span>
                              <button onClick={() => handleStartStudySession([{ ...f, steps: [] }], "rapid")}
                                style={{ background: "none", border: "none", color: C.accent, fontSize: 10, cursor: "pointer", padding: 0 }}>
                                Review →
                              </button>
                            </div>
                            <p style={{ color: C.text, fontSize: 12, fontWeight: 700, margin: "2px 0 4px" }}>{f.name}</p>
                            <p style={{ color: C.accent, fontSize: 11, fontFamily: "monospace", margin: 0 }}>{f.f}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REVISION INBOX SCREEN */}
              {tab === "revision" && (
                <RevisionInbox activeElective={userProfile?.elective}
                  onStartRevision={(lessons, formulas) => {
                    const combined = [...lessons, ...formulas];
                    handleStartStudySession(combined, "rapid");
                  }} />
              )}

              {/* PASS OPTIMIZER SCREEN */}
              {tab === "strategy" && (
                <PassOptimizer userProfile={userProfile} activeElective={userProfile?.elective}
                  onReviseWeakness={(lessonId) => {
                    const lesson = MICRO_LESSONS.find(l => l.id === lessonId);
                    if (lesson) handleStartStudySession([lesson], "rapid");
                  }} />
              )}

              {/* LEGAL SCREENS */}
              {tab === "privacy" && <PrivacyPolicy onBack={() => setTab("home")} />}
              {tab === "terms"   && <TermsOfService onBack={() => setTab("home")} />}

              {/* SESSION COMPLETE SCREEN */}
              {tab === "session_complete" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", gap: 20 }}>
                  <div style={{ fontSize: 56, lineHeight: 1 }}>🎓</div>
                  <div>
                    <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Session Complete!</h2>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                      Progress logged and synced locally.<br />Your SM-2 intervals have been updated.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
                    <button onClick={() => { setTab("home"); }}
                      style={{ background: C.accent, border: "none", borderRadius: 12, padding: "13px 20px", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      Back to Dashboard
                    </button>
                    <button onClick={() => {
                      const list = MICRO_LESSONS.filter(l => l.subjectId === activeSubject);
                      handleStartStudySession(list.length > 0 ? list : MICRO_LESSONS, energyMode);
                    }}
                      style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "13px 20px", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Study {activeSubject} Again →
                    </button>
                    <button onClick={() => setTab("revision")}
                      style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
                      Open Revision Inbox
                    </button>
                  </div>
                </div>
              )}

              {/* PRACTICE QUIZ SCREEN */}
              {tab === "practice" && (
                <PracticeQuiz
                  userProfile={userProfile}
                  isPremium={isPremium}
                  onPaywall={setPaywallTrigger}
                />
              )}

              {/* RBI CIRCULARS SCREEN */}
              {tab === "circulars" && (
                <Circulars onNavigateToLesson={(topicId) => handleLaunchTopicLesson(topicId)} />
              )}

              {/* ACTIVE STUDY SESSION CONTAINER */}
              {tab === "study_session" && (
                <StudyPanel sessionQueue={sessionQueue} energyMode={energyMode} setTab={setTab}
                  initialIndex={resumeIndex}
                  onCardAdvance={(idx) => {
                    saveSessionCheckpoint({ subjectId: activeSubject, energyMode, queueIds: sessionQueue.map(l => l.id), currentIndex: idx });
                    if (!isPremium) {
                      const newCount = dailyCardCount + 1;
                      setDailyCardCount(newCount);
                      localStorage.setItem("caiib_daily_cards", JSON.stringify({ date: new Date().toDateString(), count: newCount }));
                    }
                  }}
                  onSessionComplete={() => { clearSessionCheckpoint(); setCheckpoint(null); setResumeIndex(0); setTab("session_complete"); }} />
              )}
            </>
          )}
        </div>

        {/* ── Bottom Tab Bar ── */}
        {isOnboarded && !["study_session", "session_complete", "privacy", "terms"].includes(tab) && (
          <div style={{
            background: C.surf, borderTop: `1.5px solid ${C.border}`,
            display: "flex", padding: `8px 0 calc(12px + env(safe-area-inset-bottom, 0px))`,
            flexShrink: 0, zIndex: 20, position: "sticky", bottom: 0
          }}>
            {[
              { id: "home",     Icon: Home,     label: "Home" },
              { id: "study",    Icon: BookOpen,  label: "Explore" },
              { id: "practice", Icon: PenLine,   label: "Practice" },
              { id: "revision", Icon: RotateCcw, label: "Inbox" },
              { id: "strategy", Icon: BarChart2, label: "Strategy" }
            ].map(it => {
              const active = tab === it.id;
              return (
                <button key={it.id} onClick={() => setTab(it.id)}
                  style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 0 }}>
                  <div style={{
                    width: 40, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 14, background: active ? `${C.accent}22` : "transparent", transition: "background 0.2s"
                  }}>
                    <it.Icon size={18} color={active ? C.accent : C.dim} strokeWidth={active ? 2.5 : 1.8} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? C.accent : C.dim, letterSpacing: "0.02em" }}>
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Paywall modal */}
      {paywallTrigger && (
        <PaywallModal trigger={paywallTrigger} onClose={() => setPaywallTrigger(null)} />
      )}
    </div>
  );
}
