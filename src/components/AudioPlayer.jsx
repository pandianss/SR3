import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, FastForward } from "lucide-react";
import { C } from "../theme";

export default function AudioPlayer({ textToRead, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [showVoiceSelect, setShowVoiceSelect] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  // rateRef keeps the current rate readable inside closures without stale captures.
  const rateRef = useRef(1);

  useEffect(() => {
    const loadVoices = () => {
      if (!synthRef.current) return;
      const allVoices = synthRef.current.getVoices();
      const englishVoices = allVoices.filter(v => v.lang.startsWith("en"));
      setVoices(englishVoices);

      // Preferred voices: Google, Siri, Natural, or en-IN
      const defaultVoice =
        englishVoices.find(v => v.name.toLowerCase().includes("natural")) ||
        englishVoices.find(v => v.name.toLowerCase().includes("google")) ||
        englishVoices.find(v => v.lang.includes("en-IN")) ||
        englishVoices.find(v => v.name.toLowerCase().includes("heera")) ||
        englishVoices.find(v => v.name.toLowerCase().includes("ravi")) ||
        englishVoices.find(v => v.name.toLowerCase().includes("david")) ||
        englishVoices[0];

      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    if (synthRef.current) {
      if (typeof synthRef.current.addEventListener === "function") {
        synthRef.current.addEventListener("voiceschanged", loadVoices);
      } else {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startSpeech = (overrideVoiceName) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    // Clean characters and formatting
    const cleanText = textToRead
      .replace(/[#*`✓✅❌🏛️💧📊📈🔨🛡️🔍📢⚡📉💰📐⚖️💼📄🔑🔑]/g, "")
      .replace(/₹/g, " Rupees ")
      .replace(/Cr/g, " Crores ")
      .replace(/\b(ALM|LCR|NSFR|CRAR|RWA|CET1|Ke|Rf|Rm|NPV|WACC|CAPM|DSCR|MPBF|NWC|DRT|SARFAESI|NPA|RBI|MSME|CBS|IT|PMS|HRM)\b/g, (match) => {
        const dict = {
          ALM: "A L M", LCR: "L C R", NSFR: "N S F R", CRAR: "C R A R", RWA: "Risk Weighted Assets",
          CET1: "C E T 1", Ke: "Cost of Equity", Rf: "Risk free rate", Rm: "Market return",
          NPV: "Net Present Value", WACC: "W A C C", CAPM: "Capital Asset Pricing Model",
          DSCR: "Debt Service Coverage Ratio", MPBF: "Maximum Permissible Bank Finance",
          NWC: "Net Working Capital", DRT: "Debt Recovery Tribunal",
          SARFAESI: "Sarfayzi", NPA: "N P A", RBI: "R B I", MSME: "M S M E",
          CBS: "Core Banking Solution", IT: "I T", PMS: "Performance Management System",
          HRM: "H R M"
        };
        return dict[match] || match;
      });

    // Split text by punctuation marks to inject brief natural pauses
    const sentences = [title, ...cleanText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0)];
    const systemVoices = synthRef.current.getVoices();
    const voiceName = overrideVoiceName ?? selectedVoice;
    const activeVoice = systemVoices.find(v => v.name === voiceName);

    sentences.forEach((sentence, idx) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      // Read rate from ref — always current even when called from a stale closure.
      utterance.rate = rateRef.current;
      utterance.pitch = 1.02;
      if (activeVoice) utterance.voice = activeVoice;

      if (idx === sentences.length - 1) {
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
      }

      synthRef.current.speak(utterance);
    });

    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    if (!synthRef.current) return;

    if (isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
        setIsPlaying(true);
      } else {
        startSpeech();
      }
    }
  };

  const handleStop = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
  };

  const toggleRate = () => {
    const nextRates = { 1: 1.25, 1.25: 1.5, 1.5: 1.75, 1.75: 2, 2: 1 };
    const newRate = nextRates[rateRef.current] || 1;
    // Update ref synchronously so any immediate restart reads the new value.
    rateRef.current = newRate;
    setRate(newRate);

    if (isPlaying) {
      synthRef.current.cancel();
      // Small delay lets the synthesis engine fully clear before restarting.
      setTimeout(() => startSpeech(), 80);
    }
  };

  return (
    <div style={{
      background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Play/Pause Button */}
        <button onClick={handlePlayPause}
          style={{
            width: 36, height: 36, borderRadius: "50%", background: C.teal,
            border: "none", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#000"
          }}>
          {isPlaying ? <Pause size={16} fill="#000" /> : <Play size={16} fill="#000" style={{ marginLeft: 2 }} />}
        </button>

        {/* Stop Button */}
        <button onClick={handleStop} disabled={!isPlaying && !synthRef.current?.paused}
          style={{
            width: 28, height: 28, borderRadius: "50%", background: C.card,
            border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.muted, opacity: (isPlaying || synthRef.current?.paused) ? 1 : 0.5
          }}>
          <Square size={12} fill="currentColor" />
        </button>

        {/* Title */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <p style={{ color: C.text, fontSize: 12, fontWeight: 600, margin: 0, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isPlaying ? "Reading Aloud..." : "Listen to Lesson"}
          </p>
          <button onClick={() => setShowVoiceSelect(!showVoiceSelect)}
            style={{ background: "none", border: "none", color: C.teal, fontSize: 10, cursor: "pointer", padding: 0, textAlign: "left" }}>
            ⚙️ Tune Voice Settings
          </button>
        </div>

        {/* Speed toggle */}
        <button onClick={toggleRate}
          style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "4px 8px", color: C.teal, fontSize: 10, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 3
          }}>
          <FastForward size={10} />
          {rate}x
        </button>
      </div>

      {/* Voice Selection Dropdown */}
      {showVoiceSelect && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, background: C.card, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
          <label style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Select Narrator Voice</label>
          <select value={selectedVoice} onChange={(e) => {
            const newVoice = e.target.value;
            setSelectedVoice(newVoice);
            if (isPlaying) {
              synthRef.current.cancel();
              setTimeout(() => startSpeech(newVoice), 100);
            }
          }}
            style={{
              background: C.cardAlt, border: `1px solid ${C.border}`, color: C.text,
              fontSize: 11, padding: 4, borderRadius: 4, cursor: "pointer", outline: "none"
            }}>
            {voices.map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
          <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>
            💡 Neural/Google voices (if available) offer highly natural phrasing.
          </p>
        </div>
      )}

      {/* Animated Waveform */}
      {isPlaying && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 16 }}>
          {[...Array(12)].map((_, i) => {
            const delay = `${i * 0.1}s`;
            const duration = `${0.5 + Math.random() * 0.5}s`;
            return (
              <div key={i}
                style={{
                  width: 3,
                  background: C.teal,
                  borderRadius: 1.5,
                  animation: `audioWave ${duration} ease-in-out ${delay} infinite alternate`,
                  height: 4
                }}
              />
            );
          })}
          <style>{`
            @keyframes audioWave {
              0% { height: 4px; }
              100% { height: 16px; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
