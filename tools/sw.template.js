/* Service Worker – automatisch erzeugt von tools/build-sw.py. Nicht von Hand bearbeiten. */
const VERSION = "__VERSION__";
const CORE = __CORE__;
const REST = __REST__;
const C_CORE = "ihc323-core-" + VERSION, C_IMG = "ihc323-img-" + VERSION, C_FONT = "ihc323-fonts";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C_CORE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("ihc323-") && ![C_CORE, C_IMG, C_FONT].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
  // Alle Seitenbilder im Hintergrund für den Offline-Betrieb laden
  (async () => {
    const c = await caches.open(C_IMG);
    for (const u of REST) { try { if (!(await c.match(u))) await c.add(u); } catch (_) {} }
  })();
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(C_FONT).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (/\/ba\/(pages|fig)\/|\/img\/|\/icons\//.test(url.pathname)) {
    e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(r => {
      if (r.ok) caches.open(C_IMG).then(c => c.put(req, r.clone()));
      return r;
    })));
    return;
  }
  // Seite und Skripte: aus dem Speicher (schnell, offline), im Hintergrund aktualisieren
  e.respondWith(caches.open(C_CORE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true}) || (req.mode === "navigate" ? await c.match("index.html") : null);
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
