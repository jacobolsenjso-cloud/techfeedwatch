// Minimal service worker. Formålet er ét: at den installerede app viser noget
// fornuftigt uden forbindelse i stedet for browserens fejlside.
//
// Bevidste begrænsninger, så den ikke kan servere forældet indhold:
//  - Netværket spørges ALTID først for sider. Cachen bruges kun hvis nettet svigter.
//  - Kun same-origin GET. Annoncer, analytics og YouTube røres aldrig.
//  - Kun sidste besøgte sider gemmes, med et loft, så lageret ikke løber løbsk.
//  - Ingen caching af /api/, sitemap, rss eller adresser med query-parametre.

const VERSION = 'tfw-v1';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const OFFLINE_URL = '/offline';
const MAX_PAGES = 60;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll([OFFLINE_URL, '/icon-192.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Hold antallet af gemte sider nede
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

function cacheable(url) {
  if (url.search) return false;
  return !/^\/(api|sitemap|rss|videos\.json)/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // tredjeparter passerer urørt

  // Sidevisninger: netværket først, cache som nødplan
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh.ok && cacheable(url)) {
          const copy = fresh.clone();
          caches.open(PAGES).then((c) => c.put(request, copy).then(() => trim(PAGES, MAX_PAGES)));
        }
        return fresh;
      } catch {
        return (await caches.match(request))
            || (await caches.match(OFFLINE_URL))
            || Response.error();
      }
    })());
    return;
  }

  // Egne billeder og ikoner: cache først, ellers hent
  if (request.destination === 'image') {
    event.respondWith((async () => {
      const hit = await caches.match(request);
      if (hit) return hit;
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const copy = fresh.clone();
          caches.open(SHELL).then((c) => c.put(request, copy));
        }
        return fresh;
      } catch {
        return Response.error();
      }
    })());
  }
});
