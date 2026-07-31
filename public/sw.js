// Minimal service worker. Formålet er ét: at den installerede app viser noget
// fornuftigt uden forbindelse i stedet for browserens fejlside.
//
// Bevidste begrænsninger, så den ikke kan servere forældet indhold:
//  - Netværket spørges ALTID først for sider. Cachen bruges kun hvis nettet svigter.
//  - Kun same-origin GET. Annoncer, analytics og YouTube røres aldrig.
//  - Kun sidste besøgte sider gemmes, med et loft, så lageret ikke løber løbsk.
//  - Ingen caching af /api/, sitemap, rss eller adresser med query-parametre.

const VERSION = 'tfw-v2';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
// Med afsluttende skråstreg: sitets sider ligger på /offline/, og henter man
// /offline får man et omdirigeret svar. Se kommentaren ved storeClean nedenfor.
const OFFLINE_URL = '/offline/';
const MAX_PAGES = 60;

// Et Response med redirected: true må IKKE returneres til en navigation fra en
// service worker — browseren afviser det, og brugeren ender på en fejlside i
// stedet. Det sker for enhver adresse uden afsluttende skråstreg, da sitet
// sender dem videre. Derfor bygges svaret om, så flaget ryger af, før det gemmes.
async function storeClean(cacheName, request, response) {
  const clean = new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  const cache = await caches.open(cacheName);
  await cache.put(request, clean);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const res = await fetch(OFFLINE_URL, { cache: 'reload' });
    if (res.ok) await storeClean(SHELL, OFFLINE_URL, res);
    const icon = await fetch('/icon-192.png', { cache: 'reload' });
    if (icon.ok) await storeClean(SHELL, '/icon-192.png', icon);
    await self.skipWaiting();
  })());
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
          // Gem under den endelige adresse, så en senere opdatering rammer
          // samme nøgle uanset om brugeren kom via /side eller /side/
          storeClean(PAGES, fresh.url, fresh.clone())
            .then(() => trim(PAGES, MAX_PAGES))
            .catch(() => {});
        }
        return fresh;
      } catch {
        const hit = (await caches.match(request)) || (await caches.match(url.pathname + '/'));
        if (hit) return hit;
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
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
