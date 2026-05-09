// Main app: routing, persistence, mounting.
const { useState: useStateA, useEffect: useEffectA } = React;

// ---------- Persistence ----------
window.getProgress = function (tourId) {
  try {
    const raw = localStorage.getItem("at:tour:" + tourId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
};
window.saveProgress = function (tourId, stopIndex, time) {
  try {
    localStorage.setItem("at:tour:" + tourId, JSON.stringify({ tourId, stopIndex, time }));
    localStorage.setItem("at:lastTour", tourId);
  } catch (e) {}
};
function getLastTour() {
  const id = localStorage.getItem("at:lastTour");
  return id ? window.getProgress(id) : null;
}

// ---------- Hash router ----------
// Routes:
//  #/                      home
//  #/<destId>/<tourId>     tour overview
//  #/<destId>/<tourId>/N   player at stop N
//  #/settings              settings
function parseHash() {
  const h = (location.hash || "#/").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "settings") return { name: "settings" };
  if (parts.length === 2) return { name: "tour", destId: parts[0], tourId: parts[1] };
  if (parts.length === 3) return { name: "player", destId: parts[0], tourId: parts[1], stopIndex: parseInt(parts[2], 10) || 0 };
  return { name: "home" };
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showTranscript": true,
  "transcriptOpenByDefault": false,
  "transcriptSize": "M",
  "transcriptFont": "serif",
  "accent": "#b3573b",
  "playButtonScale": 1
}/*EDITMODE-END*/;

function App() {
  const [route, setRoute] = useStateA(parseHash());
  const [lang, setLang] = useStateA(() => localStorage.getItem("at:lang") || "es");
  const [audioLang, setAudioLang] = useStateA(() => localStorage.getItem("at:audioLang") || "es");
  const [resume, setResume] = useStateA(getLastTour());
  const [showSettings, setShowSettings] = useStateA(false);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply accent CSS var globally
  useEffectA(() => {
    document.documentElement.style.setProperty("--accent", tweaks.accent);
  }, [tweaks.accent]);

  useEffectA(() => {
    const onHash = () => {
      setRoute(parseHash());
      setResume(getLastTour());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffectA(() => { localStorage.setItem("at:lang", lang); }, [lang]);
  useEffectA(() => { localStorage.setItem("at:audioLang", audioLang); }, [audioLang]);

  const t = window.I18N[lang];
  const navigate = (path) => { location.hash = "#" + path; };

  let screen;
  if (showSettings) {
    screen = <SettingsScreen
      t={t} lang={lang} setLang={setLang}
      audioLang={audioLang} setAudioLang={setAudioLang}
      onClose={() => setShowSettings(false)}
    />;
  } else {
    switch (route.name) {
      case "tour":
        screen = <TourScreen tourId={route.tourId} t={t} lang={lang} navigate={navigate} />;
        break;
      case "player":
        screen = <PlayerScreen
          tourId={route.tourId} stopIndex={route.stopIndex}
          t={t} lang={lang}
          audioLang={audioLang} setAudioLang={setAudioLang}
          navigate={navigate}
          tweaks={tweaks}
        />;
        break;
      case "home":
      default:
        screen = <HomeScreen
          t={t} lang={lang} navigate={navigate}
          openSettings={() => setShowSettings(true)}
          resume={resume && resume.stopIndex >= 0 ? resume : null}
        />;
    }
  }

  return (
    <React.Fragment>
      {screen}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Transcripts" />
        <TweakToggle label="Show transcript section" value={tweaks.showTranscript}
          onChange={(v) => setTweak('showTranscript', v)} />
        <TweakToggle label="Open by default" value={tweaks.transcriptOpenByDefault}
          onChange={(v) => setTweak('transcriptOpenByDefault', v)} />
        <TweakRadio label="Text size" value={tweaks.transcriptSize}
          options={['S', 'M', 'L', 'XL']}
          onChange={(v) => setTweak('transcriptSize', v)} />
        <TweakRadio label="Font" value={tweaks.transcriptFont}
          options={['serif', 'sans']}
          onChange={(v) => setTweak('transcriptFont', v)} />
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={tweaks.accent}
          options={['#b3573b', '#7a3a2e', '#3f6b54', '#4a6b8a', '#8a6b3a', '#29261b']}
          onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// ---------- Service worker registration (PWA / offline) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
