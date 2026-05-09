// Service worker — caches shell + audio files after first play.
const VERSION = "v1";
const SHELL = `audio-tour-shell-${VERSION}`;
const AUDIO = `audio-tour-audio-${VERSION}`;

const SHELL_URLS = [
  "./",
  "./index.html",
  "./app.jsx",
  "./components.jsx",
  "./screens.jsx",
  "./data.js",
  "./transcripts.js",
  "./tweaks-panel.jsx",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => ![SHELL, AUDIO].includes(k)).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // Audio: cache-first, populate on play
  if (url.pathname.match(/\.mp3($|\?)/)) {
    e.respondWith(
      caches.open(AUDIO).then((cache) =>
        cache.match(e.request).then((hit) =>
          hit || fetch(e.request).then((res) => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => hit)
        )
      )
    );
    return;
  }

  // Shell: stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const fetched = fetch(e.request).then((res) => {
        if (res.ok) caches.open(SHELL).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || fetched;
    })
  );
});
