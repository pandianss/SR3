import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import {
  BookOpen, Brain, Zap, Clock, TrendingUp, Home,
  BarChart2, FlaskConical, Play, AlertTriangle,
  RotateCcw, Target, Battery, ChevronRight, Star,
  BookMarked, Shield, FileText, RefreshCw, WifiOff,
  Settings, X, KeyRound, CheckCircle2, ServerCrash,
  LogOut, User, PenLine, Users, Bell
} from "lucide-react";

import { SUBJECTS, ELECTIVES, MODULES, TOPICS, FORMULAS, RBI_CIRCULARS } from "./data/contentGraph";
import { getAllCardStates, seedMockSpacedRepetitionData, getMemoryStrengthStats, getRevisionQueue, saveSessionCheckpoint, loadSessionCheckpoint, clearSessionCheckpoint, computeStreakAndXP } from "./utils/spacedRepetition";
import { calculatePassProbability } from "./utils/aiOrchestrator";
import { C, font } from "./theme";
import { checkServerApiStatus } from "./utils/keyStore";
import { subscribeToAuthState, signOutUser, isConfigured } from "./utils/firebase";
import { APP, SERIES } from "./brand";
import { syncRead, syncWrite, ensureProfileDefaults } from "./utils/syncStore";
import { checkAndClearNudges, getStudyPartners, pairWithPartner, sendNudge, getWeeklyLeaderboard } from "./utils/partner";
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
const PracticeQuiz = lazy(() => import("./components/PracticeQuiz"));

// ── Server-side card-usage helpers ────────────────────────────────────────────
// The free-tier daily card limit is enforced server-side (users/{uid}/usage/daily
// via Firebase Admin SDK, write-protected from clients by Firestore rules).
// These helpers call the /api/usage/* endpoints; failures fall back gracefully
// to the local count so a transient server error never blocks a study session.
const API_BASE = typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : '';

async function getServerCardCount(user) {
  try {
    const token = await user?.getIdToken?.();
    const res   = await fetch(`${API_BASE}/api/usage/card-count`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal:  AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    return await res.json(); // { count, limitReached }
  } catch { return null; }
}

async function recordServerCard(user) {
  try {
    const token = await user?.getIdToken?.();
    const res   = await fetch(`${API_BASE}/api/usage/record-card`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal:  AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    return await res.json(); // { count, limitReached }
  } catch { return null; }
}

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

  // Offline sync indicator — passively updated on real Firestore writes
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Settings drawer
  const [showSettings, setShowSettings] = useState(false);

  // AI backend status — 'checking' | 'active' | 'missing' | 'error' | 'offline'
  const [apiStatus, setApiStatus] = useState("checking");

  // XP / streak — refs declared first so the effect below can safely close over them
  const userProfileRef = useRef(null);
  const sessionXPRef = useRef(0);

  useEffect(() => {
    checkServerApiStatus().then(setApiStatus);
  }, []);

  // Keep ref current so XP callbacks never close over stale profile.
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);

  // Active Subject selection
  const [activeSubject, setActiveSubject] = useState("BFM");
  const [expandedModule, setExpandedModule] = useState("BFM-B");
  const [selectedFormulaTab, setSelectedFormulaTab] = useState("All");

  // Checkpoint for mid-session resume
  const [checkpoint, setCheckpoint] = useState(null);
  const [resumeIndex, setResumeIndex] = useState(0);

  // Lesson data — loaded asynchronously so the initial bundle stays small
  const [MICRO_LESSONS, setMicroLessons] = useState([]);

  // Referral
  const [referralStats, setReferralStats] = useState(null);
  const [lastSessionXP, setLastSessionXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [partners, setPartners] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [nudgeBanner, setNudgeBanner] = useState(null);
  const [showBuddies, setShowBuddies] = useState(false);
  const [pairCode, setPairCode] = useState("");
  const [pairError, setPairError] = useState("");
  const [pairLoading, setPairLoading] = useState(false);
  const [nudgeSent, setNudgeSent] = useState({});

  // Subscription
  const [isPremium, setIsPremium] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState(null); // null = closed

  // Session preview modal (shown before launching StudyPanel)
  const [sessionPreview, setSessionPreview] = useState(null); // { queue, mode } | null

  // Custom reset confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [dailyCardCount, setDailyCardCount] = useState(() => {
    const saved = localStorage.getItem("caiib_daily_cards");
    if (!saved) return 0;
    const { date, count } = JSON.parse(saved);
    return date === new Date().toDateString() ? count : 0;
  });

  // ── Bootstrap: auth listener + cloud sync ──────────────────────────────────
  useEffect(() => {
    // Load lesson data asynchronously — keeps the initial bundle ~1.3 MB lighter.
    import("./data/microLessons").then(m => {
      setMicroLessons(m.MICRO_LESSONS);
      seedMockSpacedRepetitionData(m.MICRO_LESSONS, FORMULAS);
    });

    const unsub = subscribeToAuthState(async (user) => {
      setFirebaseUser(user);
      setAuthResolved(true);

      const uid = user?.uid ?? null;

      // Load profile — prefer Firestore, fall back to localStorage
      const rawProfile = await syncRead(uid, "profile", "caiib_user_profile");
      if (rawProfile) {
        const profile = ensureProfileDefaults(rawProfile);
        // Backfill defaults to Firestore on the next write via merge: true
        if (uid) syncWrite(uid, "profile", "caiib_user_profile", profile);
        setUserProfile(profile);
        setIsOnboarded(true);

        // Load referral stats if user has a code
        if (profile.referralCode) {
          getReferralStats(uid, profile.referralCode).then(setReferralStats);
        }

        // Load subscription status, then sync the server-authoritative card count
        // for free users so localStorage can't be cleared to bypass the daily limit.
        loadSubscriptionStatus(uid).then(s => {
          setIsPremium(s.isPremium);
          if (!s.isPremium && user) {
            getServerCardCount(user).then(data => {
              if (data?.count !== undefined) {
                setDailyCardCount(data.count);
                localStorage.setItem("caiib_daily_cards",
                  JSON.stringify({ date: new Date().toDateString(), count: data.count }));
              }
            });
          }
        });

        // Social: load partners and check for unread nudges
        getStudyPartners(profile).then(setPartners);
        checkAndClearNudges(uid).then(nudges => {
          if (nudges.length > 0) {
            setNudgeBanner(`You have ${nudges.length} study nudge${nudges.length > 1 ? "s" : ""} from your study buddies!`);
          }
        });
      } else {
        const onboarded = localStorage.getItem("caiib_onboarded") === "true";
        if (onboarded) {
          setIsOnboarded(true);
          const local = localStorage.getItem("caiib_user_profile");
          if (local) setUserProfile(ensureProfileDefaults(JSON.parse(local)));
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

    const enrichedProfile = ensureProfileDefaults({
      ...profile,
      referralCode,
      name: firebaseUser?.displayName || profile.name || "",
    });
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
    // Gate free users at session start, not mid-session.
    if (!isPremium && dailyCardCount >= FREE_DAILY_CARD_LIMIT) {
      setPaywallTrigger("card_limit");
      return;
    }
    // Show preview modal; actual launch happens when user confirms.
    setSessionPreview({ queue, mode, startIndex });
  };

  const handleLaunchConfirmed = ({ queue, mode, startIndex = 0 }) => {
    setSessionPreview(null);
    sessionXPRef.current = 0;
    setSessionQueue(queue);
    setEnergyMode(mode);
    setTab("study_session");
    saveSessionCheckpoint({ subjectId: activeSubject, energyMode: mode, queueIds: queue.map(l => l.id), currentIndex: startIndex });
    setCheckpoint(null);
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

  const handleStudyNow = () => {
    if (!isPremium && dailyCardCount >= FREE_DAILY_CARD_LIMIT) {
      setPaywallTrigger("card_limit");
      return;
    }

    const subjectLessons = MICRO_LESSONS.filter(l => l.subjectId === activeSubject);
    const { dueLessons } = getRevisionQueue(subjectLessons, []);
    const queue = dueLessons.length > 0 ? dueLessons : subjectLessons;
    handleStartStudySession(queue.length > 0 ? queue : MICRO_LESSONS, energyMode);
  };

  const handleResetApp = () => {
    localStorage.clear();
    setIsOnboarded(false);
    setUserProfile(null);
    setTab("home");
    setApiStatus("disconnected");
    setSessionQueue([]);
    setEnergyMode("low");
    setShowSettings(false);
    setShowResetConfirm(false);
  };

  const passStats = useMemo(() => calculatePassProbability(userProfile, 0), [userProfile]);

  const handlePairPartner = async () => {
    if (!firebaseUser) { setPairError("Sign in to pair with partners."); return; }
    setPairLoading(true); setPairError("");
    const result = await pairWithPartner(firebaseUser.uid, pairCode, userProfile);
    setPairLoading(false);
    if (result.error) { setPairError(result.error); return; }
    const updatedProfile = { ...userProfile, partnerIds: result.newPartnerIds };
    setUserProfile(updatedProfile);
    syncWrite(firebaseUser.uid, "profile", "caiib_user_profile", updatedProfile);
    if (result.partnerProfile) setPartners(prev => [...prev, result.partnerProfile]);
    setPairCode(""); setPairError("");
  };

  const handleSendNudge = async (partnerUid) => {
    if (!firebaseUser) return;
    await sendNudge(firebaseUser.uid, partnerUid);
    setNudgeSent(prev => ({ ...prev, [partnerUid]: true }));
  };

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
        @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(105vh) rotate(720deg); opacity: 0; } }
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
                <span style={{ color: C.muted, fontSize: 12, fontWeight: 500 }}>· {tab === "home" ? "Dashboard" : tab === "study" ? "Study" : tab === "practice" ? "Practice" : tab === "revision" ? "Review" : tab === "strategy" ? "Plan" : "Circulars"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Streak + career rank */}
              {userProfile && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.warn }}>🔥 {userProfile.streak || 0}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.dim, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 6px" }}>
                    {userProfile.careerTitle || "Novice"}
                  </span>
                </div>
              )}
              {/* Settings */}
              <button onClick={() => setShowSettings(true)}
                aria-label="Open settings"
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Settings size={15} color={C.muted} />
              </button>
            </div>
          </div>
        )}

        {/* ── Settings Drawer ── */}
        {showSettings && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {/* Backdrop */}
            <div onClick={() => { setShowSettings(false); setShowResetConfirm(false); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
            <div style={{
              position: "relative", width: "100%", maxWidth: 480,
              background: C.surf, borderRadius: "20px 20px 0 0",
              border: `1px solid ${C.border}`, borderBottom: "none",
              padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 16, zIndex: 1
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Settings</span>
                <button onClick={() => { setShowSettings(false); setShowResetConfirm(false); }}
                  aria-label="Close settings"
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                  {isConfigured ? (
                    <button onClick={() => { setShowSettings(false); setFirebaseUser(false); }}
                      style={{ background: C.accent, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#000", fontSize: 11, fontWeight: 700 }}>
                      Sign in
                    </button>
                  ) : (
                    <span style={{ color: C.dim, fontSize: 10, fontStyle: "italic" }}>Requires internet</span>
                  )}
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

                {import.meta.env.DEV ? (
                  <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>
                    The API key lives exclusively in the server .env file — it is never sent to the browser. Start the server with <code style={{ color: C.accent, fontSize: 10 }}>npm run server</code> to enable AI case studies, coaching, and strategic advice.
                  </p>
                ) : (
                  <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>
                    AI features require a stable connection to our servers. If unavailable, all study content remains accessible without AI.
                  </p>
                )}

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
                    const msg = `📚 I'm using SuperRecall - CAIIB for my exam — use my code ${userProfile.referralCode} to sign up! https://play.google.com/store/apps/details?id=com.superrecall.caiib`;
                    if (navigator.share) {
                      navigator.share({ title: "SuperRecall - CAIIB", text: msg });
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

              {/* Sync status — passive, updated on real writes */}
              <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <RefreshCw size={14} color={C.teal} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.muted, fontSize: 11, fontWeight: 600, margin: 0 }}>Progress sync</p>
                  <p style={{ color: C.dim, fontSize: 10, margin: "2px 0 0" }}>
                    {lastSyncTime ? `Last synced: ${lastSyncTime}` : firebaseUser ? "Synced automatically after each card" : "Stored locally (sign in to sync)"}
                  </p>
                </div>
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
              {!showResetConfirm ? (
                <button onClick={() => setShowResetConfirm(true)}
                  style={{
                    background: `${C.err}18`, border: `1.5px solid ${C.err}44`, color: C.err,
                    borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700
                  }}>
                  Reset All Progress & Onboarding
                </button>
              ) : (
                <div style={{ background: `${C.err}12`, border: `1.5px solid ${C.err}44`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ color: C.err, fontWeight: 700, fontSize: 13, margin: 0 }}>Are you sure?</p>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0, lineHeight: 1.4 }}>
                    This permanently deletes all study progress, streaks, and card history. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowResetConfirm(false)}
                      style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 0", color: C.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Cancel
                    </button>
                    <button onClick={handleResetApp}
                      style={{ flex: 1, background: C.err, border: "none", borderRadius: 8, padding: "10px 0", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Yes, Delete Everything
                    </button>
                  </div>
                </div>
              )}
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
            <Onboarding onComplete={handleOnboardingComplete} onBack={() => { signOutUser(); setFirebaseUser(null); }} />
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
                    <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Free plan today</span>
                          <span style={{ color: dailyCardCount >= FREE_DAILY_CARD_LIMIT ? C.err : C.text, fontSize: 11, fontWeight: 700 }}>
                            {Math.max(0, FREE_DAILY_CARD_LIMIT - dailyCardCount)} cards left
                          </span>
                        </div>
                        <div style={{ height: 4, background: C.border, borderRadius: 99 }}>
                          <div style={{ height: 4, borderRadius: 99, background: dailyCardCount >= FREE_DAILY_CARD_LIMIT ? C.err : C.accent, width: `${Math.max(0, 100 - (dailyCardCount / FREE_DAILY_CARD_LIMIT) * 100)}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                      <button onClick={() => setPaywallTrigger("generic")}
                        style={{ background: C.accent, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#000", fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>
                        Upgrade
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

                  {/* Primary action */}
                  <div style={{
                    background: `${C.accent}12`, border: `1.5px solid ${C.accent}44`,
                    borderRadius: 16, padding: 16, marginBottom: 18,
                    display: "flex", alignItems: "center", gap: 14
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Play size={18} color={C.accent} fill={C.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.text, fontSize: 16, fontWeight: 800, margin: 0 }}>Study Now</p>
                      <p style={{ color: C.muted, fontSize: 11, margin: "3px 0 0", lineHeight: 1.4 }}>
                        {SUBJECTS.concat(ELECTIVES).find(s => s.id === activeSubject)?.label || activeSubject} · {energyMode === "focus" ? "Deep Focus" : energyMode === "rapid" ? "Rapid Revision" : "Low Energy"}
                      </p>
                    </div>
                    <button onClick={handleStudyNow}
                      style={{ background: C.accent, border: "none", borderRadius: 12, padding: "12px 16px", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Start
                    </button>
                  </div>

                  {/* Subject Picker */}
                  <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Subject
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
                    Mode
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {[
                      { id: "low", Icon: Battery, label: "Low Energy", sub: "Audio cards · One-handed review", color: C.teal, bg: "#071E1C", mins: "5–10 min" },
                      { id: "focus", Icon: Brain, label: "Deep Focus", sub: "Numericals · Cases · Calculator", color: C.blue, bg: "#081830", mins: "20–40 min" },
                      { id: "rapid", Icon: Zap, label: "Rapid Revision", sub: "Formula drills · Weak-memory queue", color: C.accent, bg: "#1E1505", mins: "10–15 min" }
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

                  {/* Continue Study Block — shows highest-priority due card for active subject */}
                  {(() => {
                    const subjectLessons = MICRO_LESSONS.filter(l => l.subjectId === activeSubject);
                    const { dueLessons } = getRevisionQueue(subjectLessons, []);
                    const nextLesson = dueLessons[0] || subjectLessons[0];
                    const isDue = dueLessons.length > 0;
                    const subjectMeta = SUBJECTS.concat(ELECTIVES).find(s => s.id === activeSubject);
                    const firstModule = (MODULES[activeSubject] || [])[0];
                    if (!nextLesson) return null;
                    return (
                      <div style={{ background: C.card, border: `1.5px solid ${isDue ? C.accent : C.border}`, borderRadius: 14, padding: 14, marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1, overflow: "hidden", marginRight: 12 }}>
                            <span style={{ color: isDue ? C.accent : C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>
                              {isDue ? `⚡ DUE NOW · ${subjectMeta?.label || activeSubject}` : `UP NEXT · ${subjectMeta?.label || activeSubject}`}
                            </span>
                            <h4 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: "2px 0", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{nextLesson.title}</h4>
                            <span style={{ fontSize: 9, background: `${subjectMeta?.color || C.blue}20`, color: subjectMeta?.color || C.blue, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                              {activeSubject} · {firstModule?.name?.replace(/Module [A-Z]: /, "") || "Module A"}
                            </span>
                          </div>
                          <button onClick={() => handleLaunchTopicLesson(nextLesson.topicId)}
                            aria-label={`Study ${nextLesson.title}`}
                            style={{ background: C.accent, border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Play size={16} color="#000" fill="#000" style={{ marginLeft: 2 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Study Buddies Card */}
                  <div onClick={() => {
                    setShowBuddies(true);
                    setLeaderboardLoading(true);
                    getWeeklyLeaderboard(userProfile).then(lb => { setLeaderboard(lb); setLeaderboardLoading(false); });
                  }}
                    style={{
                      background: `${C.blue}12`, border: `1.5px solid ${C.blue}33`, borderRadius: 14,
                      padding: 14, marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 12
                    }}>
                    <Users size={20} color={C.blue} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.blue, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Study Buddies</p>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "2px 0 0" }}>
                        {partners.length > 0 ? `${partners.length} partner${partners.length > 1 ? "s" : ""} linked` : "Link study partners"}
                      </p>
                      <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Nudge, compete & track weekly XP →</p>
                    </div>
                    <ChevronRight size={16} color={C.blue} />
                  </div>

                  {/* Pass Probability Snapshot */}
                  {/* Pass Probability — hidden until user has studied enough cards to produce meaningful data */}
                  {(() => {
                    const memStats = getMemoryStrengthStats(MICRO_LESSONS.length, FORMULAS.length);
                    const totalReviewed = memStats.mastered + memStats.reviewing + memStats.forgotten;
                    if (totalReviewed < 10) {
                      return (
                        <div onClick={() => setTab("strategy")}
                          style={{
                            background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14,
                            padding: 14, marginBottom: 24, cursor: "pointer", display: "flex", alignItems: "center", gap: 12
                          }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Pass Probability</p>
                            <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: "4px 0 2px" }}>Study 10 cards to unlock →</p>
                            <div style={{ height: 4, background: C.border, borderRadius: 99, marginTop: 4 }}>
                              <div style={{ height: 4, borderRadius: 99, background: C.accent, width: `${(totalReviewed / 10) * 100}%`, transition: "width 0.4s" }} />
                            </div>
                            <p style={{ color: C.dim, fontSize: 10, margin: "4px 0 0" }}>{totalReviewed} / 10 cards reviewed</p>
                          </div>
                          <ChevronRight size={18} color={C.dim} />
                        </div>
                      );
                    }
                    return (
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
                    );
                  })()}
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
                        {["All", "ABM", "BFM", "ABFM", "BRBL"].map(f => (
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
                  microLessons={MICRO_LESSONS}
                  onStartRevision={(lessons, formulas) => {
                    const combined = [...lessons, ...formulas];
                    handleStartStudySession(combined, energyMode);
                  }} />
              )}

              {/* PASS OPTIMIZER SCREEN */}
              {tab === "strategy" && (
                <PassOptimizer userProfile={userProfile} activeElective={userProfile?.elective}
                  partners={partners}
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
                  {/* XP + streak summary */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    <div style={{ background: `${C.accent}18`, border: `1.5px solid ${C.accent}44`, borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
                      <p style={{ color: C.accent, fontSize: 20, fontWeight: 800, margin: 0 }}>+{lastSessionXP}</p>
                      <p style={{ color: C.muted, fontSize: 10, margin: "2px 0 0", fontWeight: 600 }}>XP EARNED</p>
                    </div>
                    <div style={{ background: `${C.warn}18`, border: `1.5px solid ${C.warn}44`, borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
                      <p style={{ color: C.warn, fontSize: 20, fontWeight: 800, margin: 0 }}>🔥 {userProfile?.streak ?? 0}</p>
                      <p style={{ color: C.muted, fontSize: 10, margin: "2px 0 0", fontWeight: 600 }}>DAY STREAK</p>
                    </div>
                    <div style={{ background: `${C.blue}18`, border: `1.5px solid ${C.blue}44`, borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
                      <p style={{ color: C.blue, fontSize: 14, fontWeight: 800, margin: 0 }}>{userProfile?.careerTitle || "Novice"}</p>
                      <p style={{ color: C.muted, fontSize: 10, margin: "2px 0 0", fontWeight: 600 }}>RANK</p>
                    </div>
                  </div>
                  {(() => {
                    const subjectLessons = MICRO_LESSONS.filter(l => l.subjectId === activeSubject);
                    const { dueLessons, dueFormulas } = getRevisionQueue(subjectLessons, FORMULAS.filter(f => f.sub === activeSubject));
                    const dueCount = dueLessons.length + dueFormulas.length;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
                        {dueCount > 0 && (
                          <button onClick={() => handleStartStudySession([...dueLessons, ...dueFormulas], energyMode)}
                            style={{ background: C.accent, border: "none", borderRadius: 12, padding: "13px 20px", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            Review {dueCount} Due Card{dueCount !== 1 ? "s" : ""} →
                          </button>
                        )}
                        <button onClick={() => { setTab("home"); }}
                          style={{ background: dueCount > 0 ? C.card : C.accent, border: dueCount > 0 ? `1.5px solid ${C.border}` : "none", borderRadius: 12, padding: "13px 20px", color: dueCount > 0 ? C.text : "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Back to Dashboard
                        </button>
                        <button onClick={() => setTab("revision")}
                          style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
                          Open Review
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* PRACTICE QUIZ SCREEN */}
              {tab === "practice" && (
                <Suspense fallback={
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="spin-animate" style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%" }} />
                  </div>
                }>
                  <PracticeQuiz
                    userProfile={userProfile}
                    isPremium={isPremium}
                    onPaywall={setPaywallTrigger}
                  />
                </Suspense>
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
                    // +10 XP per card (all except the last; last is handled in onSessionComplete)
                    sessionXPRef.current += 10;
                    const uid = firebaseUser?.uid ?? null;
                    const updated = computeStreakAndXP(userProfileRef.current, { cardXP: 10 });
                    userProfileRef.current = updated;
                    setUserProfile(updated);
                    syncWrite(uid, "profile", "caiib_user_profile", updated);
                    const now = new Date();
                    setLastSyncTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);

                    saveSessionCheckpoint({ subjectId: activeSubject, energyMode, queueIds: sessionQueue.map(l => l.id), currentIndex: idx });
                    if (!isPremium) {
                      // Optimistic local update for immediate UI feedback
                      const newCount = dailyCardCount + 1;
                      setDailyCardCount(newCount);
                      localStorage.setItem("caiib_daily_cards", JSON.stringify({ date: new Date().toDateString(), count: newCount }));
                      // Mirror to server (fire-and-forget); server count is
                      // authoritative and will override on next session start.
                      recordServerCard(firebaseUser).then(data => {
                        if (data?.count !== undefined) setDailyCardCount(data.count);
                      });
                    }
                  }}
                  onSessionComplete={() => {
                    // +10 XP for last card + 50 session bonus
                    sessionXPRef.current += 60;
                    const uid = firebaseUser?.uid ?? null;
                    const updated = computeStreakAndXP(userProfileRef.current, { cardXP: 10, sessionBonus: true });
                    userProfileRef.current = updated;
                    setUserProfile(updated);
                    syncWrite(uid, "profile", "caiib_user_profile", updated);
                    setLastSessionXP(sessionXPRef.current);

                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 3500);

                    clearSessionCheckpoint(); setCheckpoint(null); setResumeIndex(0); setTab("session_complete");
                  }} />
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
              { id: "home",      Icon: Home,      label: "Home" },
              { id: "study",     Icon: BookOpen,   label: "Study" },
              { id: "practice",  Icon: PenLine,    label: "Practice" },
              { id: "revision",  Icon: RotateCcw,  label: "Review" },
              { id: "circulars", Icon: FileText,   label: "Circulars" },
              { id: "strategy",  Icon: BarChart2,  label: "Plan" }
            ].map(it => {
              const active = tab === it.id;
              return (
                <button key={it.id} onClick={() => setTab(it.id)}
                  aria-label={it.label}
                  style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 0, minHeight: 44 }}>
                  <div style={{
                    width: 36, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 12, background: active ? `${C.accent}22` : "transparent", transition: "background 0.2s"
                  }}>
                    <it.Icon size={16} color={active ? C.accent : C.dim} strokeWidth={active ? 2.5 : 1.8} />
                  </div>
                  <span style={{ fontSize: 8, fontWeight: active ? 700 : 500, color: active ? C.accent : C.dim, letterSpacing: "0.02em" }}>
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Session preview modal — confirms queue size and mode before launching */}
      {sessionPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setSessionPreview(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)" }} />
          <div style={{
            position: "relative", width: "100%", maxWidth: 480,
            background: C.surf, borderRadius: "20px 20px 0 0",
            border: `1px solid ${C.border}`, borderBottom: "none",
            padding: "24px 20px 36px", zIndex: 1, display: "flex", flexDirection: "column", gap: 16
          }}>
            {(() => {
              const modeInfo = {
                low:   { label: "Low Energy",      mins: "5–10 min",  color: C.teal },
                focus: { label: "Deep Focus",       mins: "20–40 min", color: C.blue },
                rapid: { label: "Rapid Revision",   mins: "10–15 min", color: C.accent },
              }[sessionPreview.mode] || { label: "Study", mins: "–", color: C.accent };
              const cardCount = sessionPreview.queue.length;
              const estMins = Math.ceil(cardCount * (sessionPreview.mode === "focus" ? 3 : sessionPreview.mode === "rapid" ? 1.5 : 2));
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ color: C.dim, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>Starting session</p>
                      <h3 style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: 0 }}>{modeInfo.label}</h3>
                    </div>
                    <button onClick={() => setSessionPreview(null)} aria-label="Cancel" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={15} color={C.muted} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { label: "Cards", value: cardCount },
                      { label: "Est. time", value: `~${estMins} min` },
                      { label: "Mode", value: modeInfo.label },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                        <p style={{ color: modeInfo.color, fontWeight: 800, fontSize: 16, margin: 0 }}>{s.value}</p>
                        <p style={{ color: C.dim, fontSize: 9, margin: "2px 0 0", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {!isPremium && (
                    <p style={{ color: C.dim, fontSize: 11, margin: 0, textAlign: "center" }}>
                      {FREE_DAILY_CARD_LIMIT - dailyCardCount} free card{FREE_DAILY_CARD_LIMIT - dailyCardCount !== 1 ? "s" : ""} remaining today
                    </p>
                  )}
                  <button onClick={() => handleLaunchConfirmed(sessionPreview)}
                    style={{ background: modeInfo.color, border: "none", borderRadius: 14, padding: "15px 20px", color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                    Start Session →
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Paywall modal */}
      {paywallTrigger && (
        <PaywallModal trigger={paywallTrigger} onClose={() => setPaywallTrigger(null)} />
      )}

      {/* Confetti overlay — shown for 3.5s on session complete */}
      {showConfetti && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 500 }}>
          {["#F59E0B","#10B981","#3B82F6","#EF4444","#8B5CF6","#06B6D4","#FBBF24","#F472B6"].flatMap((color, ci) =>
            [0,1,2,3].map(j => {
              const i = ci * 4 + j;
              return (
                <div key={i} style={{
                  position: "absolute", top: 0, left: `${(i * 3.1 + 2) % 98}%`,
                  width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 10 : 7,
                  background: color, borderRadius: i % 2 === 0 ? "50%" : 2,
                  animation: `confettiFall ${1.2 + (i % 5) * 0.25}s ${(i % 8) * 0.12}s ease-in forwards`,
                }} />
              );
            })
          )}
        </div>
      )}

      {/* Nudge banner */}
      {nudgeBanner && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: C.surf, border: `1.5px solid ${C.teal}`, borderRadius: 12,
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
          zIndex: 200, maxWidth: 440, width: "calc(100% - 32px)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
        }}>
          <Bell size={16} color={C.teal} />
          <span style={{ color: C.text, fontSize: 12, fontWeight: 600, flex: 1 }}>{nudgeBanner}</span>
          <button onClick={() => setNudgeBanner(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Study Buddies Drawer */}
      {showBuddies && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setShowBuddies(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
          <div style={{
            position: "relative", width: "100%", maxWidth: 480,
            background: C.surf, borderRadius: "20px 20px 0 0",
            border: `1px solid ${C.border}`, borderBottom: "none",
            padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 16,
            zIndex: 1, maxHeight: "85vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={18} color={C.blue} />
                <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Study Buddies</span>
              </div>
              <button onClick={() => setShowBuddies(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={20} /></button>
            </div>

            {/* Link a partner */}
            <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Link a Study Partner</span>
              <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Enter your partner's 8-character referral code to pair with them.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={pairCode} onChange={e => { setPairCode(e.target.value.toUpperCase()); setPairError(""); }}
                  placeholder="e.g. DHRU8K2P"
                  maxLength={8}
                  style={{ flex: 1, background: C.cardAlt, border: `1.5px solid ${pairError ? C.err : C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", padding: "8px 12px", outline: "none" }}
                />
                <button
                  disabled={pairCode.length < 6 || pairLoading}
                  onClick={handlePairPartner}
                  style={{ background: C.blue, border: "none", borderRadius: 8, padding: "8px 14px", color: "#000", fontSize: 12, fontWeight: 700, cursor: pairCode.length >= 6 && !pairLoading ? "pointer" : "not-allowed", opacity: pairCode.length >= 6 && !pairLoading ? 1 : 0.5 }}>
                  {pairLoading ? "…" : "Link"}
                </button>
              </div>
              {pairError && <p style={{ color: C.err, fontSize: 11, margin: 0 }}>{pairError}</p>}
            </div>

            {/* Partner list */}
            {partners.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Partners</span>
                {partners.map(p => (
                  <div key={p.uid} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.blue}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={18} color={C.blue} />
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{ color: C.text, fontSize: 13, fontWeight: 700, margin: 0 }}>{p.name}</p>
                      <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>
                        {p.careerTitle} · 🔥 {p.streak} days · {(p.xp || 0).toLocaleString()} XP
                      </p>
                    </div>
                    <button
                      disabled={nudgeSent[p.uid]}
                      onClick={() => handleSendNudge(p.uid)}
                      style={{ background: nudgeSent[p.uid] ? C.card : `${C.teal}22`, border: `1px solid ${nudgeSent[p.uid] ? C.border : C.teal}`, borderRadius: 8, padding: "6px 10px", color: nudgeSent[p.uid] ? C.dim : C.teal, fontSize: 11, fontWeight: 700, cursor: nudgeSent[p.uid] ? "default" : "pointer", flexShrink: 0 }}>
                      {nudgeSent[p.uid] ? "Nudged ✓" : "Nudge"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Weekly Leaderboard */}
            {leaderboardLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <div className="spin-animate" style={{ width: 14, height: 14, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.teal}`, borderRadius: "50%" }} />
                <span style={{ color: C.muted, fontSize: 11 }}>Loading leaderboard…</span>
              </div>
            )}
            {!leaderboardLoading && leaderboard.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Weekly XP Leaderboard</span>
                {leaderboard.map((entry, rank) => (
                  <div key={entry.uid} style={{
                    background: entry.isSelf ? `${C.accent}12` : C.card,
                    border: `1.5px solid ${entry.isSelf ? `${C.accent}44` : C.border}`,
                    borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10
                  }}>
                    <span style={{ color: rank === 0 ? C.accent : C.muted, fontWeight: 800, fontSize: 14, width: 20, textAlign: "center" }}>
                      {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}`}
                    </span>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p style={{ color: entry.isSelf ? C.accent : C.text, fontSize: 12, fontWeight: 700, margin: 0 }}>{entry.name}</p>
                      <p style={{ color: C.muted, fontSize: 10, margin: "1px 0 0" }}>{entry.careerTitle} · 🔥 {entry.streak} days</p>
                    </div>
                    <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{(entry.xp || 0).toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
            )}

            {!leaderboardLoading && partners.length === 0 && leaderboard.length === 0 && (
              <p style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: "10px 0" }}>
                Link a partner above to start competing on the leaderboard.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
