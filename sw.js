/* Service Worker – automatisch erzeugt von tools/build-sw.py. Nicht von Hand bearbeiten. */
const VERSION = "ef4f31a1f678";
const CORE = ["./", "index.html", "manual-app.js", "ba/manual.js", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "img/legende-s49.jpg", "img/legende-s50.jpg", "img/legende-s51.jpg", "img/plan-g167.jpg", "img/plan-g168.jpg"];
const REST = ["ba/fig/p03-1.jpg", "ba/fig/p03-2.jpg", "ba/fig/p06-1.jpg", "ba/fig/p07-1.jpg", "ba/fig/p09-1.jpg", "ba/fig/p09-2.jpg", "ba/fig/p09-3.jpg", "ba/fig/p10-1.jpg", "ba/fig/p11-1.jpg", "ba/fig/p11-2.jpg", "ba/fig/p12-1.jpg", "ba/fig/p12-2.jpg", "ba/fig/p13-1.jpg", "ba/fig/p14-1.jpg", "ba/fig/p15-1.jpg", "ba/fig/p15-2.jpg", "ba/fig/p15-3.jpg", "ba/fig/p16-1.jpg", "ba/fig/p18-1.jpg", "ba/fig/p18-2.jpg", "ba/fig/p19-1.jpg", "ba/fig/p19-2.jpg", "ba/fig/p20-1.jpg", "ba/fig/p20-2.jpg", "ba/fig/p21-1.jpg", "ba/fig/p21-2.jpg", "ba/fig/p22-1.jpg", "ba/fig/p22-2.jpg", "ba/fig/p22-3.jpg", "ba/fig/p23-1.jpg", "ba/fig/p25-1.jpg", "ba/fig/p27-1.jpg", "ba/fig/p27-2.jpg", "ba/fig/p28-1.jpg", "ba/fig/p28-2.jpg", "ba/fig/p28-3.jpg", "ba/fig/p29-1.jpg", "ba/fig/p29-2.jpg", "ba/fig/p29-3.jpg", "ba/fig/p30-1.jpg", "ba/fig/p30-2.jpg", "ba/fig/p31-1.jpg", "ba/fig/p31-2.jpg", "ba/fig/p31-3.jpg", "ba/fig/p32-1.jpg", "ba/fig/p32-2.jpg", "ba/fig/p32-3.jpg", "ba/fig/p32-4.jpg", "ba/fig/p33-1.jpg", "ba/fig/p33-2.jpg", "ba/fig/p33-3.jpg", "ba/fig/p34-1.jpg", "ba/fig/p34-2.jpg", "ba/fig/p35-1.jpg", "ba/fig/p36-1.jpg", "ba/fig/p36-2.jpg", "ba/fig/p36-3.jpg", "ba/fig/p36-4.jpg", "ba/fig/p37-1.jpg", "ba/fig/p37-2.jpg", "ba/fig/p37-3.jpg", "ba/fig/p38-1.jpg", "ba/fig/p38-2.jpg", "ba/fig/p38-3.jpg", "ba/fig/p38-4.jpg", "ba/fig/p39-1.jpg", "ba/fig/p39-2.jpg", "ba/fig/p40-1.jpg", "ba/fig/p40-2.jpg", "ba/fig/p40-3.jpg", "ba/fig/p41-1.jpg", "ba/fig/p41-2.jpg", "ba/fig/p42-1.jpg", "ba/fig/p42-2.jpg", "ba/fig/p42-3.jpg", "ba/fig/p43-1.jpg", "ba/fig/p43-2.jpg", "ba/fig/p43-3.jpg", "ba/fig/p43-4.jpg", "ba/fig/p45-1.jpg", "ba/fig/p46-1.jpg", "ba/fig/p46-2.jpg", "ba/fig/p46-3.jpg", "ba/pages/p01.jpg", "ba/pages/p02.jpg", "ba/pages/p03.jpg", "ba/pages/p04.jpg", "ba/pages/p05.jpg", "ba/pages/p06.jpg", "ba/pages/p07.jpg", "ba/pages/p08.jpg", "ba/pages/p09.jpg", "ba/pages/p10.jpg", "ba/pages/p11.jpg", "ba/pages/p12.jpg", "ba/pages/p13.jpg", "ba/pages/p14.jpg", "ba/pages/p15.jpg", "ba/pages/p16.jpg", "ba/pages/p17.jpg", "ba/pages/p18.jpg", "ba/pages/p19.jpg", "ba/pages/p20.jpg", "ba/pages/p21.jpg", "ba/pages/p22.jpg", "ba/pages/p23.jpg", "ba/pages/p24.jpg", "ba/pages/p25.jpg", "ba/pages/p26.jpg", "ba/pages/p27.jpg", "ba/pages/p28.jpg", "ba/pages/p29.jpg", "ba/pages/p30.jpg", "ba/pages/p31.jpg", "ba/pages/p32.jpg", "ba/pages/p33.jpg", "ba/pages/p34.jpg", "ba/pages/p35.jpg", "ba/pages/p36.jpg", "ba/pages/p37.jpg", "ba/pages/p38.jpg", "ba/pages/p39.jpg", "ba/pages/p40.jpg", "ba/pages/p41.jpg", "ba/pages/p42.jpg", "ba/pages/p43.jpg", "ba/pages/p44.jpg", "ba/pages/p45.jpg", "ba/pages/p46.jpg", "ba/pages/p47.jpg", "ba/pages/p48.jpg", "ba/pages/p49.jpg", "ba/pages/p50.jpg", "ba/pages/p51.jpg", "ba/pages/p52.jpg", "ba/pages/p53.jpg", "ba/pages/p54.jpg", "ba/pages/p55.jpg", "ba/pages/p56.jpg", "ba/pages/p57.jpg", "ba/pages/p58.jpg", "ba/pages/p59.jpg"];
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
