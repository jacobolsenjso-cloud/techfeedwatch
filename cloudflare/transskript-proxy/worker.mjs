// Transskript-mellemmand på Cloudflare Workers.
//
// Hvorfor: YouTube blokerer undertekst-hentning fra GitHubs servere (målt
// 14–15/9: "Transcript is disabled" på næsten alle videoer, 12 min ventetid
// pr. video). Cloudflares adresser er andre — og biblioteket youtube-transcript
// kan få sin egen fetch-funktion, så robotten kan sende PRÆCIS de samme kald
// gennem denne Worker uden at ændre andet.
//
// To indgange:
//   GET  /test?v=<videoId>   — henter selv underteksterne og rapporterer (til test)
//   POST /proxy              — videresender ét kald til *.youtube.com
//                              body: { url, method, headers, body }
// Begge kræver headeren  X-Noegle: <PROXY_NOEGLE>  (sat som Secret i Cloudflare),
// så ingen andre kan bruge Workeren som gratis mellemmand.

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.PROXY_NOEGLE || request.headers.get('X-Noegle') !== env.PROXY_NOEGLE) {
      return new Response('forbidden', { status: 403 });
    }

    if (url.pathname === '/test') {
      return json(await testHent(url.searchParams.get('v') || 'dQw4w9WgXcQ'));
    }

    if (url.pathname === '/proxy' && request.method === 'POST') {
      const { url: maal, method = 'GET', headers = {}, body } = await request.json();
      let m;
      try { m = new URL(maal); } catch { return new Response('bad url', { status: 400 }); }
      if (!m.hostname.endsWith('.youtube.com')) return new Response('only youtube', { status: 400 });
      const svar = await fetch(maal, { method, headers, body });
      // Svaret sendes uændret tilbage (status + tekst), så biblioteket ser det som fra YouTube.
      return new Response(await svar.text(), {
        status: svar.status,
        headers: { 'Content-Type': svar.headers.get('Content-Type') || 'text/plain' },
      });
    }

    return new Response('not found', { status: 404 });
  },
};

// Gør det samme som youtube-transcript's fetchViaInnerTube + hentning af
// første spor, og rapporterer hvert trin — så vi kan se, hvor YouTube evt. siger nej.
async function testHent(videoId) {
  const r = { videoId, trin: [] };
  const t0 = Date.now();
  const resp = await fetch(INNERTUBE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_UA },
    body: JSON.stringify({ context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } }, videoId }),
  });
  r.trin.push({ trin: 'innertube', status: resp.status, ms: Date.now() - t0 });
  if (!resp.ok) { r.resultat = 'innertube afvist'; return r; }
  const data = await resp.json();
  r.playability = data?.playabilityStatus?.status;
  r.playabilityReason = data?.playabilityStatus?.reason;
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  r.spor = Array.isArray(tracks) ? tracks.map((t) => t.languageCode) : null;
  if (!tracks?.length) { r.resultat = 'ingen spor (= "Transcript is disabled" i biblioteket)'; return r; }
  const t1 = Date.now();
  const tr = await fetch(tracks[0].baseUrl, { headers: { 'User-Agent': ANDROID_UA } });
  const xml = await tr.text();
  r.trin.push({ trin: 'timedtext', status: tr.status, ms: Date.now() - t1, tegn: xml.length });
  r.segmenter = (xml.match(/<text /g) || []).length;
  r.resultat = r.segmenter > 0 ? 'OK — undertekster hentet' : 'spor fundet, men tomt svar';
  return r;
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
