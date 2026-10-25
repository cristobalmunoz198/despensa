// Despensa y Súper — guarda la app en el teléfono para que abra sin señal.
// Si cambias index.html, sube también este archivo con un número de versión nuevo.
const CACHE = "despensa-v1";
const APP = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const FUENTES = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // La página: primero internet (para recibir actualizaciones), si no hay señal usa la copia guardada.
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith(".html"))) {
    e.respondWith(
      fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copia));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Íconos, manifiesto y tipografías: copia guardada primero.
  if (url.origin === location.origin || FUENTES.includes(url.origin)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === "opaque") {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return res;
      }))
    );
  }
  // Todo lo demás (la conexión con Apps Script) va directo a internet.
});
