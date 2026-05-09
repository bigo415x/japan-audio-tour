// Screen components: Home, Destination, Tour, Player, Settings
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, useMemo } = React;

// Sort destinations by trip date relative to today.
// Order: ACTIVE (today is inside range) → UPCOMING (soonest first) → PAST (most recent first).
// Falls back to manual base order [hakone, tokyo, kyoto] when no dates match meaningfully.
function sortedDestinations() {
  const all = window.TOUR_DATA.destinations;
  const baseOrder = ["hakone", "tokyo", "kyoto"];
  const ordered = baseOrder.map((id) => all.find((d) => d.id === id)).filter(Boolean);
  const now = Date.now();
  function status(d) {
    if (!d.startDate) return { phase: 2, t: 0 };
    const s = new Date(d.startDate).getTime();
    const e = new Date(d.endDate || d.startDate).getTime();
    if (now >= s && now <= e) return { phase: 0, t: -e };           // active
    if (now < s)              return { phase: 1, t: s };             // upcoming
    return { phase: 2, t: -e };                                      // past
  }
  return ordered
    .map((d) => ({ d, base: ordered.indexOf(d), s: status(d) }))
    .sort((a, b) => a.s.phase - b.s.phase || a.s.t - b.s.t || a.base - b.base)
    .map((x) => x.d);
}

function destinationDateLabel(d, lang) {
  if (!d.startDate) return null;
  const now = Date.now();
  const s = new Date(d.startDate);
  const e = new Date(d.endDate || d.startDate);
  const fmt = (date) => date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { month: "short", day: "numeric" });
  const range = s.toDateString() === e.toDateString() ? fmt(s) : `${fmt(s)} – ${fmt(e)}`;
  if (now >= s.getTime() && now <= e.getTime()) {
    return { label: lang === "en" ? "Today" : "Hoy", range, phase: "active" };
  }
  if (now < s.getTime()) {
    const days = Math.ceil((s.getTime() - now) / 86400000);
    const inN = lang === "en" ? (days === 1 ? "Tomorrow" : `In ${days} days`) : (days === 1 ? "Mañana" : `En ${days} días`);
    return { label: inN, range, phase: "upcoming" };
  }
  return { label: lang === "en" ? "Past" : "Pasado", range, phase: "past" };
}

// ---------- Home ----------
function HomeScreen({ t, lang, navigate, openSettings, resume }) {
  const D = sortedDestinations();
  return (
    <Page>
      <TopBar title={t.appName} onSettings={openSettings} t={t} />
      <div style={{ padding: "8px 20px 0" }}>
        <h1 style={{
          fontFamily: "'Newsreader', serif",
          fontWeight: 400, fontSize: 40, lineHeight: 1.05,
          margin: "8px 0 6px",
          letterSpacing: "-0.018em",
          color: "var(--ink)",
        }}>
          <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Japón</em>, a tu paso.
        </h1>
        <p style={{ margin: "0 0 18px", fontSize: 16, color: "var(--ink-soft)", maxWidth: 320 }}>
          Siete recorridos en audio. Pulsa play en cada parada.
        </p>
      </div>

      {resume && (
        <ResumeBanner resume={resume} t={t} lang={lang} navigate={navigate} />
      )}

      <div style={{ padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 28 }}>
        {D.map((dest) => (
          <DestinationSection key={dest.id} dest={dest} t={t} lang={lang} navigate={navigate} />
        ))}
      </div>

      <Footer t={t} />
    </Page>
  );
}

function DestinationSection({ dest, t, lang, navigate }) {
  const tours = dest.tours.map((id) => window.TOUR_DATA.tours[id]);
  const totalStops = tours.reduce((n, x) => n + x.stops.length, 0);
  const dateInfo = destinationDateLabel(dest, lang);
  return (
    <section style={{ opacity: dateInfo?.phase === "past" ? 0.62 : 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: dest.accent }} />
          <h2 style={{
            margin: 0,
            fontFamily: "'Newsreader', serif",
            fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}>{lang === "en" ? dest.nameEn : dest.name}</h2>
          {dateInfo && dateInfo.phase === "active" && (
            <span style={{
              fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
              padding: "3px 7px", borderRadius: 999,
              background: dest.accent, color: "var(--paper)",
            }}>{dateInfo.label}</span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "ui-monospace, monospace" }}>
          {tours.length} · {totalStops} {t.stops}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{
          margin: 0, fontSize: 14, color: "var(--ink-soft)",
          fontStyle: "italic", fontFamily: "'Newsreader', serif",
        }}>{lang === "en" ? dest.taglineEn : dest.tagline}</p>
        {dateInfo && (
          <span style={{
            fontSize: 11, fontFamily: "ui-monospace, monospace",
            color: dateInfo.phase === "active" ? dest.accent : "var(--ink-faint)",
            fontWeight: dateInfo.phase === "active" ? 600 : 400,
            whiteSpace: "nowrap", marginLeft: 12,
          }}>
            {dateInfo.phase === "upcoming" ? `${dateInfo.label} · ${dateInfo.range}` : dateInfo.range}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {tours.map((tour) => (
          <TourCard
            key={tour.id} tour={tour} dest={dest} t={t} lang={lang}
            onOpen={() => navigate(`/${dest.id}/${tour.id}`)}
            progress={window.getProgress(tour.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ResumeBanner({ resume, t, lang, navigate }) {
  const tour = window.TOUR_DATA.tours[resume.tourId];
  if (!tour) return null;
  const stop = tour.stops[resume.stopIndex];
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <button onClick={() => navigate(`/${tour.destination}/${tour.id}/${resume.stopIndex}`)} style={{
        display: "flex", alignItems: "center", gap: 14,
        width: "100%", textAlign: "left",
        padding: "14px 16px",
        border: "1px solid var(--rule)",
        background: "var(--card)",
        borderRadius: 12,
        cursor: "pointer",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          background: "var(--accent)", color: "var(--paper)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}><Icon.Play size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 600 }}>
            {t.resumeFrom}
          </div>
          <div style={{
            fontFamily: "'Newsreader', serif", fontSize: 17, color: "var(--ink)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{lang === "en" ? stop.nameEn : stop.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "ui-monospace, monospace" }}>
            {(lang === "en" ? tour.nameEn : tour.name)} · {resume.stopIndex + 1}/{tour.stops.length}
          </div>
        </div>
        <Icon.ChevronRight />
      </button>
    </div>
  );
}

function Footer({ t }) {
  return (
    <div style={{
      padding: "8px 20px 28px", textAlign: "center",
      color: "var(--ink-soft)", fontSize: 12,
      fontFamily: "'Newsreader', serif", fontStyle: "italic",
    }}>
      Hecho con cariño · {new Date().getFullYear()}
    </div>
  );
}

// ---------- Tour overview screen ----------
function TourScreen({ tourId, t, lang, navigate }) {
  const tour = window.TOUR_DATA.tours[tourId];
  const dest = window.TOUR_DATA.destinations.find((d) => d.id === tour.destination);
  const progress = window.getProgress(tourId);

  return (
    <Page accent={dest.accent}>
      <TopBar
        title={lang === "en" ? dest.nameEn : dest.name}
        onBack={() => navigate("/")}
        t={t}
      />
      <HeroPhoto
        label={(tour.nameEn || tour.name).toUpperCase()}
        accent={dest.accent}
        height={220}
      />
      <div style={{ padding: "20px 20px 4px" }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
          color: dest.accent, fontWeight: 600, marginBottom: 6,
        }}>
          {lang === "en" ? dest.nameEn : dest.name} · {tour.stops.length} {t.stops}
        </div>
        <h1 style={{
          margin: 0, fontFamily: "'Newsreader', serif", fontWeight: 400,
          fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.015em",
        }}>{lang === "en" ? tour.nameEn : tour.name}</h1>
        <p style={{ margin: "10px 0 18px", fontSize: 16, lineHeight: 1.5, color: "var(--ink-soft)" }}>
          {lang === "en" ? tour.blurbEn : tour.blurb}
        </p>

        <button onClick={() => navigate(`/${dest.id}/${tour.id}/${progress?.stopIndex || 0}`)} style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "16px 20px",
          background: "var(--ink)", color: "var(--paper)",
          border: "none", borderRadius: 12, cursor: "pointer",
          fontSize: 17, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
        }}>
          <Icon.Play size={20} />
          <span style={{ flex: 1, textAlign: "left" }}>
            {progress && progress.stopIndex > 0 ? t.resume : t.startTour}
          </span>
          {progress && progress.stopIndex > 0 && (
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, opacity: 0.7 }}>
              {progress.stopIndex + 1}/{tour.stops.length}
            </span>
          )}
        </button>
      </div>

      <ol style={{
        listStyle: "none", padding: "20px 20px 24px", margin: "16px 0 0",
        borderTop: "1px dashed var(--rule)",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        {tour.stops.map((stop, i) => (
          <StopRow
            key={i}
            stop={stop} index={i} total={tour.stops.length}
            isCurrent={progress?.stopIndex === i}
            accent={dest.accent}
            lang={lang}
            pending={!stop.file && !stop.fileEs}
            onClick={() => navigate(`/${dest.id}/${tour.id}/${i}`)}
          />
        ))}
      </ol>
    </Page>
  );
}

function StopRow({ stop, index, total, isCurrent, accent, lang, pending, onClick }) {
  return (
    <li>
      <button onClick={onClick} style={{
        display: "flex", alignItems: "center", gap: 14,
        width: "100%", padding: "14px 4px",
        background: "transparent", border: "none", textAlign: "left",
        cursor: "pointer",
        borderBottom: index === total - 1 ? "none" : "1px dashed var(--rule)",
        opacity: pending ? 0.45 : 1,
      }}>
        <div style={{
          width: 36, height: 36, minWidth: 36,
          borderRadius: 999,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: isCurrent ? accent : "transparent",
          color: isCurrent ? "var(--paper)" : "var(--ink-soft)",
          border: isCurrent ? "none" : "1px solid var(--rule)",
          fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 600,
        }}>{String(index + 1).padStart(2, "0")}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Newsreader', serif", fontSize: 19, lineHeight: 1.2,
            color: "var(--ink)", letterSpacing: "-0.005em",
          }}>{lang === "en" ? stop.nameEn : stop.name}</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 2, lineHeight: 1.35 }}>
            {pending ? "— próximamente —" : (lang === "en" ? stop.descEn : stop.desc)}
          </div>
        </div>
        <Icon.ChevronRight />
      </button>
    </li>
  );
}

// ---------- Transcript ----------
function TranscriptSection({ tourId, stopIndex, audioLang, lang, tweaks }) {
  const text = window.getTranscript(tourId, stopIndex, audioLang);
  const empty = !text || !text.trim();
  const [open, setOpen] = useStateS(tweaks.transcriptOpenByDefault && !empty);

  useEffectS(() => {
    setOpen(tweaks.transcriptOpenByDefault && !empty);
  }, [tourId, stopIndex, audioLang, tweaks.transcriptOpenByDefault]);

  if (!tweaks.showTranscript) return null;

  const labels = {
    es: { transcript: "Transcripción", show: "Ver transcripción", hide: "Ocultar transcripción", placeholder: "[ La transcripción de este capítulo se añadirá al desplegar. ]", lang: "Idioma del audio" },
    en: { transcript: "Transcript", show: "Show transcript", hide: "Hide transcript", placeholder: "[ Transcript will be filled in at deploy time. ]", lang: "Audio language" },
  }[lang];

  const fontSize = { S: 14, M: 16, L: 18, XL: 20 }[tweaks.transcriptSize] || 16;
  const fontFamily = tweaks.transcriptFont === "serif"
    ? "'Newsreader', Georgia, serif"
    : "'DM Sans', system-ui, sans-serif";

  return (
    <section style={{
      margin: "20px 20px 0",
      borderTop: "1px dashed var(--rule)",
      paddingTop: 18,
    }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "10px 0", border: "none", background: "transparent",
        cursor: "pointer", color: "var(--ink)",
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
      }}>
        <span style={{
          fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
          color: "var(--ink-soft)", fontWeight: 600,
        }}>
          {labels.transcript}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
          {open ? labels.hide : labels.show}
          <span style={{
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "rotate(0)",
            transition: "transform .15s ease",
          }}><Icon.ChevronRight size={14} /></span>
        </span>
      </button>
      {open && (
        <div style={{
          padding: "8px 0 24px",
          fontSize, lineHeight: 1.62,
          fontFamily,
          color: empty ? "var(--ink-faint)" : "var(--ink)",
          fontStyle: empty ? "italic" : "normal",
          whiteSpace: "pre-wrap",
          letterSpacing: tweaks.transcriptFont === "serif" ? "-0.005em" : "0",
        }}>
          {empty ? labels.placeholder : text}
        </div>
      )}
    </section>
  );
}

// ---------- Player screen ----------
function PlayerScreen({ tourId, stopIndex, t, lang, audioLang, setAudioLang, navigate, tweaks }) {
  const tour = window.TOUR_DATA.tours[tourId];
  const dest = window.TOUR_DATA.destinations.find((d) => d.id === tour.destination);
  const stop = tour.stops[stopIndex];
  const isBilingual = tour.languages.length > 1;
  const effectiveAudioLang = isBilingual ? audioLang : "es";

  const audioRef = useRefS(null);
  const [playing, setPlaying] = useStateS(false);
  const [time, setTime] = useStateS(0);
  const [duration, setDuration] = useStateS(0);
  const [error, setError] = useStateS(null);

  const src = window.audioPath(tourId, stopIndex, effectiveAudioLang);
  const isPending = !src;

  useEffectS(() => {
    const a = audioRef.current;
    if (!a || isPending) return;
    setError(null);
    setTime(0);
    setDuration(0);
    a.src = src;
    const saved = window.getProgress(tourId);
    if (saved && saved.stopIndex === stopIndex && saved.time > 0) {
      a.currentTime = saved.time;
      setTime(saved.time);
    }
    a.load();
  }, [src, tourId, stopIndex, isPending]);

  useEffectS(() => {
    window.saveProgress(tourId, stopIndex, time);
  }, [tourId, stopIndex, time]);

  useEffectS(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: lang === "en" ? stop.nameEn : stop.name,
      artist: lang === "en" ? tour.nameEn : tour.name,
      album: lang === "en" ? dest.nameEn : dest.name,
    });
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => goPrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => goNext());
    navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15));
    navigator.mediaSession.setActionHandler('seekforward', () => skip(15));
  }, [stopIndex, tourId, lang]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a || isPending) return;
    if (a.paused) a.play().catch((e) => setError(e.message)); else a.pause();
  }
  function skip(s) {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min((a.duration || 0), a.currentTime + s));
  }
  function seek(pct) {
    const a = audioRef.current; if (!a || !a.duration) return;
    a.currentTime = pct * a.duration;
  }
  function goPrev() {
    if (stopIndex > 0) navigate(`/${dest.id}/${tour.id}/${stopIndex - 1}`);
  }
  function goNext() {
    if (stopIndex < tour.stops.length - 1) navigate(`/${dest.id}/${tour.id}/${stopIndex + 1}`);
  }

  const pct = duration ? time / duration : 0;

  return (
    <Page accent={dest.accent}>
      {!isPending && (
        <audio
          ref={audioRef}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.target.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onEnded={() => goNext()}
          onError={() => setError("missing")}
        />
      )}
      <TopBar
        title={lang === "en" ? tour.nameEn : tour.name}
        onBack={() => navigate(`/${dest.id}/${tour.id}`)}
        t={t}
      />

      <div style={{ padding: "0 20px" }}>
        <HeroPhoto
          label={(stop.nameEn || stop.name).toUpperCase()}
          accent={dest.accent}
          ratio="4 / 3"
          rounded={14}
          dim={1.0}
        />
      </div>

      <div style={{ padding: "20px 20px 0", textAlign: "center" }}>
        <div style={{
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--ink-soft)", fontFamily: "ui-monospace, monospace",
          marginBottom: 6,
        }}>
          {t.stop} {stopIndex + 1} {t.of} {tour.stops.length}
        </div>
        <h1 style={{
          margin: "0 0 8px",
          fontFamily: "'Newsreader', serif", fontWeight: 400,
          fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.015em",
          textWrap: "pretty",
        }}>{lang === "en" ? stop.nameEn : stop.name}</h1>
        <p style={{
          margin: "0 auto 4px", maxWidth: 420,
          fontSize: 15.5, lineHeight: 1.45, color: "var(--ink-soft)",
        }}>{lang === "en" ? stop.descEn : stop.desc}</p>

        {isBilingual && (
          <LanguagePill audioLang={audioLang} setAudioLang={setAudioLang} />
        )}
      </div>

      <Scrubber pct={pct} time={time} duration={duration} onSeek={seek} accent={dest.accent} />

      <PlayerControls
        playing={playing} togglePlay={togglePlay}
        onPrev={goPrev} onNext={goNext}
        onBack15={() => skip(-15)} onFwd15={() => skip(15)}
        canPrev={stopIndex > 0} canNext={stopIndex < tour.stops.length - 1}
        accent={dest.accent} t={t}
        disabled={isPending}
      />

      <TranscriptSection
        tourId={tourId} stopIndex={stopIndex}
        audioLang={effectiveAudioLang} lang={lang}
        tweaks={tweaks}
      />

      {isPending && (
        <div style={{
          margin: "20px 20px 0", padding: "12px 14px",
          background: "var(--card)", border: "1px solid var(--rule)",
          borderRadius: 10, fontSize: 13, color: "var(--ink-soft)",
          textAlign: "center",
        }}>
          {t.audioPending}
        </div>
      )}

      {error === "missing" && (
        <div style={{
          margin: "20px 20px 0", padding: "12px 14px",
          background: "var(--card)", border: "1px solid var(--rule)",
          borderRadius: 10, fontSize: 13, color: "var(--ink-soft)",
        }}>
          <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{t.audioMissing}:</div>
          <code style={{
            fontFamily: "ui-monospace, monospace", fontSize: 12,
            wordBreak: "break-all", color: "var(--accent)",
          }}>{src}</code>
        </div>
      )}
    </Page>
  );
}

function Scrubber({ pct, time, duration, onSeek, accent }) {
  const ref = useRefS(null);
  function handle(e) {
    const r = ref.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    onSeek(Math.max(0, Math.min(1, x / r.width)));
  }
  return (
    <div style={{ padding: "26px 20px 4px" }}>
      <div ref={ref}
        onClick={handle}
        onTouchMove={handle}
        style={{
          height: 28, position: "relative", cursor: "pointer",
          display: "flex", alignItems: "center",
          touchAction: "none",
        }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 4, top: 12,
          background: "var(--rule)", borderRadius: 999,
        }} />
        <div style={{
          position: "absolute", left: 0, height: 4, top: 12,
          width: `${pct * 100}%`,
          background: accent, borderRadius: 999,
        }} />
        <div style={{
          position: "absolute", left: `calc(${pct * 100}% - 8px)`, top: 6,
          width: 16, height: 16, borderRadius: 999,
          background: accent,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace", fontSize: 12,
        color: "var(--ink-soft)", marginTop: 4,
      }}>
        <span>{fmtTime(time)}</span>
        <span>{fmtTime(duration)}</span>
      </div>
    </div>
  );
}

function PlayerControls({ playing, togglePlay, onPrev, onNext, onBack15, onFwd15, canPrev, canNext, accent, t, disabled }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12, padding: "16px 20px 28px",
    }}>
      <RoundBtn onClick={onPrev} disabled={!canPrev} aria-label={t.previous} size={56}>
        <Icon.Prev size={22} />
      </RoundBtn>
      <RoundBtn onClick={onBack15} aria-label={t.skipBack} size={62} disabled={disabled}>
        <Icon.Back15 size={26} />
      </RoundBtn>
      <button onClick={togglePlay} aria-label={playing ? t.pause : t.play}
        disabled={disabled}
        style={{
          width: 96, height: 96, borderRadius: 999,
          background: disabled ? "var(--rule)" : accent, color: "var(--paper)",
          border: "none", cursor: disabled ? "default" : "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: disabled ? "none" : `0 12px 32px -8px ${accent}, 0 2px 8px rgba(0,0,0,0.1)`,
          transition: "transform .12s ease",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.96)"; }}
        onMouseUp={(e) => e.currentTarget.style.transform = ""}
        onMouseLeave={(e) => e.currentTarget.style.transform = ""}
      >
        {playing ? <Icon.Pause size={36} /> : <Icon.Play size={36} />}
      </button>
      <RoundBtn onClick={onFwd15} aria-label={t.skipForward} size={62} disabled={disabled}>
        <Icon.Fwd15 size={26} />
      </RoundBtn>
      <RoundBtn onClick={onNext} disabled={!canNext} aria-label={t.next} size={56}>
        <Icon.Next size={22} />
      </RoundBtn>
    </div>
  );
}

function RoundBtn({ children, onClick, disabled, size = 56, ...rest }) {
  return (
    <button onClick={onClick} disabled={disabled} {...rest} style={{
      width: size, height: size, borderRadius: 999,
      border: "1px solid var(--rule)",
      background: "var(--card)",
      color: disabled ? "var(--ink-faint)" : "var(--ink)",
      cursor: disabled ? "default" : "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      opacity: disabled ? 0.4 : 1,
    }}>{children}</button>
  );
}

function LanguagePill({ audioLang, setAudioLang }) {
  return (
    <div style={{
      display: "inline-flex", marginTop: 12,
      background: "var(--card)", border: "1px solid var(--rule)",
      borderRadius: 999, padding: 3,
      fontSize: 12, fontFamily: "ui-monospace, monospace",
    }}>
      {[{ id: "es", label: "ES" }, { id: "en", label: "EN" }].map((o) => (
        <button key={o.id} onClick={() => setAudioLang(o.id)} style={{
          padding: "6px 14px", borderRadius: 999,
          border: "none", cursor: "pointer",
          background: audioLang === o.id ? "var(--ink)" : "transparent",
          color: audioLang === o.id ? "var(--paper)" : "var(--ink-soft)",
          fontWeight: 600, letterSpacing: "0.08em",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ---------- Settings ----------
function SettingsScreen({ t, lang, setLang, audioLang, setAudioLang, onClose }) {
  const [cleared, setCleared] = useStateS(false);
  function clearProgress() {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("at:")) localStorage.removeItem(k);
    });
    setCleared(true);
    setTimeout(() => setCleared(false), 1800);
  }
  return (
    <Page>
      <TopBar title={t.settings} onBack={onClose} t={t} />
      <div style={{ padding: "8px 20px 24px" }}>
        <SettingGroup label={t.language}>
          <Segmented value={lang} onChange={setLang} options={[{ id: "es", label: "Español" }, { id: "en", label: "English" }]} />
        </SettingGroup>
        <SettingGroup label={t.audioLanguage} hint="Solo afecta a los recorridos de Hakone (bilingües).">
          <Segmented value={audioLang} onChange={setAudioLang} options={[{ id: "es", label: "Español" }, { id: "en", label: "English" }]} />
        </SettingGroup>
        <div style={{ marginTop: 24, padding: "16px", border: "1px dashed var(--rule)", borderRadius: 12 }}>
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 10 }}>
            {t.aboutResume}
          </div>
          <button onClick={clearProgress} style={{
            padding: "10px 14px", borderRadius: 8,
            border: "1px solid var(--rule)", background: "var(--card)",
            color: "var(--ink)", cursor: "pointer",
            fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          }}>{cleared ? "✓ " + t.progressCleared : t.clearProgress}</button>
        </div>
        <p style={{ marginTop: 20, fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.5, fontFamily: "ui-monospace, monospace" }}>
          v0.1 · audio/&lt;Dest&gt;/&lt;Tour&gt;/NN_Name.mp3
        </p>
      </div>
    </Page>
  );
}

function SettingGroup({ label, hint, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
        color: "var(--ink-soft)", fontWeight: 600, marginBottom: 8,
      }}>{label}</div>
      {children}
      {hint && <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink-faint)" }}>{hint}</div>}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{
      display: "flex", background: "var(--card)",
      border: "1px solid var(--rule)", borderRadius: 10, padding: 4, gap: 4,
    }}>
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          flex: 1, padding: "10px 12px", borderRadius: 7, border: "none",
          background: value === o.id ? "var(--ink)" : "transparent",
          color: value === o.id ? "var(--paper)" : "var(--ink-soft)",
          fontSize: 14, fontWeight: 500, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

Object.assign(window, { HomeScreen, TourScreen, PlayerScreen, SettingsScreen });
