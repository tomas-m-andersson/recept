// Service worker för Mina recept: hämtar alltid senaste versionen när du är online
// och faller tillbaka på sparad kopia när du är offline.
const CACHE = "recept-v1";
const SKAL = ["./", "index.html", "recept.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(SKAL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nycklar) => Promise.all(nycklar.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // rör inte api.github.com eller andra sajter
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res && res.ok) {
          const kopia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, kopia));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))
      )
  );
});
