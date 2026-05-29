import { useState, useEffect, useCallback } from "react";
import { RBI_CIRCULARS } from "../data/contentGraph";
import { AlertCircle, Calendar, Link, RefreshCw, WifiOff } from "lucide-react";
import { C } from "../theme";

// Static circulars from contentGraph act as the offline fallback baseline.
const STATIC_CIRCULARS = RBI_CIRCULARS;

export default function Circulars({ onNavigateToLesson }) {
  const [liveData,    setLiveData]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);    // 'offline' | 'error' | null
  const [scrapedAt,   setScrapedAt]   = useState(null);
  const [selectedSub, setSelectedSub] = useState("All");

  // Merge live data with static fallback — live items take precedence by id.
  const liveIds      = new Set(liveData.map(c => c.id));
  const ALL_CIRCULARS = [
    ...liveData,
    ...STATIC_CIRCULARS.filter(c => !liveIds.has(c.id))
  ];
  const subjects = ["All", ...new Set(ALL_CIRCULARS.map(c => c.subjectId))];
  const filtered = selectedSub === "All"
    ? ALL_CIRCULARS
    : ALL_CIRCULARS.filter(c => c.subjectId === selectedSub);

  const fetchCirculars = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else              setLoading(true);
    setError(null);

    try {
      const url = forceRefresh ? '/api/circulars?refresh=true' : '/api/circulars';
      const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        setLiveData(json.data);
        setScrapedAt(json.meta?.scrapedAt ?? null);
      }
    } catch (e) {
      console.error('[Circulars] Fetch error:', e);
      setError(e.message?.includes('Failed to fetch') || e.name === 'TimeoutError'
        ? 'offline'
        : 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCirculars(false); }, [fetchCirculars]);

  const formattedScrapeTime = scrapedAt
    ? new Date(scrapedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 20px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>
            RBI Circular Intelligence
          </h2>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 4, marginBottom: 0 }}>
            {formattedScrapeTime
              ? `Live data · last scraped ${formattedScrapeTime}`
              : 'Regulatory circulars mapped to the CAIIB syllabus.'}
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchCirculars(true)}
          disabled={refreshing || loading}
          title="Force re-scrape RBI site"
          style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "8px 12px", cursor: (refreshing || loading) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
            color: C.teal, fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2
          }}>
          <RefreshCw size={13} className={refreshing ? "spin-animate" : ""} />
          {refreshing ? "Scraping…" : "Refresh Live"}
        </button>
      </div>

      {/* Offline / error banner */}
      {error && (
        <div style={{
          background: error === 'offline' ? `${C.warn}18` : `${C.err}18`,
          border: `1px solid ${error === 'offline' ? C.warn : C.err}`,
          borderRadius: 10, padding: "10px 14px", marginTop: 12, marginBottom: 8,
          display: "flex", alignItems: "center", gap: 8
        }}>
          {error === 'offline'
            ? <WifiOff size={14} color={C.warn} />
            : <AlertCircle size={14} color={C.err} />}
          <div>
            <p style={{ color: error === 'offline' ? C.warn : C.err, fontSize: 12, fontWeight: 600, margin: 0 }}>
              {error === 'offline'
                ? 'Backend server offline — showing cached content'
                : 'Failed to load live circulars — showing cached content'}
            </p>
            <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>
              {error === 'offline'
                ? 'Run: npm run server  to enable live scraping.'
                : 'The RBI site may be temporarily unreachable. Try again shortly.'}
            </p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              border: `1px solid ${C.border}`, borderRadius: 14,
              padding: 16, height: 110,
              background: `linear-gradient(90deg, ${C.card} 25%, ${C.cardAlt} 50%, ${C.card} 75%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite'
            }} />
          ))}
          <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && ALL_CIRCULARS.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 14, marginBottom: 16, flexWrap: "wrap" }}>
          {subjects.map(sub => (
            <button key={sub} onClick={() => setSelectedSub(sub)}
              style={{
                background: selectedSub === sub ? C.accent : C.card,
                border: `1px solid ${selectedSub === sub ? C.accent : C.border}`,
                borderRadius: 8, padding: "5px 12px",
                color: selectedSub === sub ? "#000" : C.muted,
                fontSize: 11, fontWeight: 600, cursor: "pointer"
              }}>
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Circular cards */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
          {filtered.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, textAlign: "center", marginTop: 24 }}>
              No circulars found for this subject filter.
            </p>
          ) : (
            filtered.map(c => {
              const isHighRelevance = c.relevance >= 90;
              return (
                <div key={c.id} style={{
                  background: C.card,
                  border: `1.5px solid ${isHighRelevance ? `${C.accent}44` : C.border}`,
                  borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10
                }}>
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Calendar size={12} color={C.muted} />
                      <span style={{ color: C.muted, fontSize: 10, fontWeight: 500 }}>{c.date}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.dim }} />
                      <span style={{ color: C.accent, fontSize: 10, fontWeight: 600 }}>{c.tag}</span>
                    </div>
                    <div style={{
                      background: isHighRelevance ? `${C.err}15` : `${C.warn}15`,
                      border: `1px solid ${isHighRelevance ? C.err : C.warn}`,
                      borderRadius: 4, padding: "2px 5px", fontSize: 9, fontWeight: 700,
                      color: isHighRelevance ? C.err : C.warn
                    }}>
                      {c.relevance}% Exam Weight
                    </div>
                  </div>

                  {/* Title */}
                  <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.35 }}>
                    {c.title}
                  </h3>

                  {/* Summary */}
                  <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                    <p style={{ color: C.text, fontSize: 12, lineHeight: 1.45, margin: 0 }}>
                      {c.summary}
                    </p>
                  </div>

                  {/* Action bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: C.dim, fontFamily: "monospace" }}>ID: {c.id}</span>
                    {c.topicId && (
                      <button onClick={() => onNavigateToLesson(c.topicId)}
                        style={{
                          background: "none", border: "none", color: C.teal, fontSize: 11,
                          fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4, padding: 0
                        }}>
                        <Link size={12} />
                        View Linked Syllabus Unit →
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
