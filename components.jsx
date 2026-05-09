// Shared UI components for the audio tour player.
// All components attached to window for cross-script availability.

const { useState, useEffect, useRef, useCallback } = React;

// ---------- Hero photo placeholder ----------
// Subtle striped SVG with a monospace label. Designed to be replaced with real photos.
function HeroPhoto({ label, accent, height = 260, ratio, rounded = 0, dim = 0.86 }) {
  const stripeColor = accent || "oklch(0.55 0.04 60)";
  const id = "hp-" + Math.random().toString(36).slice(2, 9);
  const style = {
    width: "100%",
    height: ratio ? "auto" : height,
    aspectRatio: ratio,
    borderRadius: rounded,
    overflow: "hidden",
    position: "relative",
    background: `linear-gradient(135deg, ${stripeColor} 0%, oklch(0.4 0.03 50) 100%)`,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
  };
  return (
    <div style={style}>
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 300" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
        <defs>
          <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="white" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#${id})`} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,${dim - 0.5}) 100%)`,
      }} />
      <div style={{
        position: "absolute", left: 14, top: 14,
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
        fontSize: 10, letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.78)",
        textTransform: "uppercase",
        padding: "4px 8px",
        background: "rgba(0,0,0,0.18)",
        backdropFilter: "blur(4px)",
        borderRadius: 4,
      }}>
        {label}
      </div>
    </div>
  );
}

// ---------- Icons (inline SVG, no library) ----------
const Icon = {
  Play: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>
  ),
  Pause: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4.5" height="14" rx="1"/><rect x="13.5" y="5" width="4.5" height="14" rx="1"/></svg>
  ),
  Prev: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h2v14H7zM20 5.5v13a1 1 0 0 1-1.55.83l-9-6.5a1 1 0 0 1 0-1.66l9-6.5A1 1 0 0 1 20 5.5z"/></svg>
  ),
  Next: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M15 5h2v14h-2zM4 5.5v13a1 1 0 0 0 1.55.83l9-6.5a1 1 0 0 0 0-1.66l-9-6.5A1 1 0 0 0 4 5.5z"/></svg>
  ),
  Back15: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>
      <text x="12" y="15.5" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="700">15</text>
    </svg>
  ),
  Fwd15: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>
      <text x="12" y="15.5" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="700">15</text>
    </svg>
  ),
  ChevronLeft: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  ChevronRight: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Settings: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.16.34.25.71.25 1.09 0 .38-.09.75-.25 1.09z"/></svg>
  ),
  Pin: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
  ),
  Headphones: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/></svg>
  ),
};

// ---------- Format helpers ----------
function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ---------- App-shell page wrapper ----------
function Page({ children, accent }) {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--paper)",
      color: "var(--ink)",
      paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
      "--page-accent": accent || "var(--accent)",
    }}>
      {children}
    </div>
  );
}

// ---------- Top bar ----------
function TopBar({ title, onBack, onSettings, t }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      paddingTop: "max(env(safe-area-inset-top), 12px)",
      background: "linear-gradient(to bottom, var(--paper) 60%, transparent)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 12px",
        gap: 12,
      }}>
        {onBack ? (
          <button onClick={onBack} aria-label={t.back} style={btnGhost}>
            <Icon.ChevronLeft />
          </button>
        ) : <div style={{ width: 44 }} />}
        <div style={{
          fontFamily: "'Newsreader', serif",
          fontWeight: 500, fontSize: 17,
          letterSpacing: "0.01em",
          flex: 1, textAlign: "center",
          fontStyle: "italic",
          color: "var(--ink-soft)",
        }}>{title}</div>
        {onSettings ? (
          <button onClick={onSettings} aria-label={t.settings} style={btnGhost}>
            <Icon.Settings />
          </button>
        ) : <div style={{ width: 44 }} />}
      </div>
    </div>
  );
}

const btnGhost = {
  width: 44, height: 44, minWidth: 44,
  borderRadius: 999,
  border: "none",
  background: "transparent",
  color: "var(--ink-soft)",
  cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

// ---------- Tour card (used on home & destination pages) ----------
function TourCard({ tour, dest, t, lang, onOpen, progress }) {
  const isBilingual = tour.languages.length > 1;
  const stopsLabel = isBilingual ? t.bilingual : t.spanishOnly;
  return (
    <button onClick={onOpen} style={{
      display: "block", width: "100%", textAlign: "left",
      padding: 0, border: "none", background: "transparent", cursor: "pointer",
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -12px rgba(60,40,20,0.18)",
      transition: "transform .15s ease",
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.985)"}
    onMouseUp={(e) => e.currentTarget.style.transform = ""}
    onMouseLeave={(e) => e.currentTarget.style.transform = ""}
    >
      <HeroPhoto label={`${(tour.nameEn || tour.name).toUpperCase()}`} accent={dest.accent} height={150} rounded={0} />
      <div style={{ padding: "14px 16px 16px", background: "var(--card)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h3 style={{
            margin: 0,
            fontFamily: "'Newsreader', serif",
            fontWeight: 500, fontSize: 22, lineHeight: 1.15,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
          }}>{lang === "en" ? tour.nameEn : tour.name}</h3>
          <span style={{ fontSize: 13, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
            {tour.stops.length} {t.stops}
          </span>
        </div>
        <p style={{
          margin: "6px 0 12px", fontSize: 14.5, lineHeight: 1.45,
          color: "var(--ink-soft)",
        }}>{lang === "en" ? tour.blurbEn : tour.blurb}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: dest.accent, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: dest.accent }} />
            {stopsLabel}
          </span>
          {progress && progress.stopIndex > 0 && (
            <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "ui-monospace, monospace" }}>
              {progress.stopIndex + 1} / {tour.stops.length}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

Object.assign(window, { HeroPhoto, Icon, fmtTime, Page, TopBar, TourCard, btnGhost });
