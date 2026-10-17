// tfw-push (17/10-2026): push-beskeder for techfeedwatch.com. Jacob valgte A: højst 1 besked om dagen.
//
// Tre offentlige adresser (kun fra sitet - CORS, og højst 10 tilmeldinger i minuttet pr. afsender):
//   POST /subscribe    { subscription, topics }  -> gemmer tilmeldingen (anonym: kun push-adresse + emner)
//   POST /unsubscribe  { endpoint }              -> sletter den med det samme
//   GET  /besked?id=   -> dagens besked til netop denne tilmelding (titel, tekst, adresse)
//
// Selve udsendelsen er IKKE en adresse, men metoden Sender.sendPortion, som kun tfw-starter kan kalde
// (service binding). Beskeden sendes UDEN indhold ("bank på"); telefonens service worker henter teksten
// fra /besked. Så skal intet krypteres.
//
// Lager (KV "SUBS"):
//   s:<sha256 af push-adressen>  metadata { e: push-adresse, t: emner }. Udløber efter 180 dage uden
//                                besøg (siden fornyer den ved besøg), så glemte tilmeldinger ikke bliver liggende.
//   koersel:<dato>               dagens tilstand: færdig?, tællere, artiklerne der var med (til i morgen).
//   jwt:<push-tjeneste>          VAPID-token genbruges i op til 11 timer (Apple: højst ny hver time).
//
// Review 17/10 (separat agent) - rettet: samme artikel to dage i træk, tilstand læst forældet mellem
// portioner (sendes nu med som argument), fejl der flyttede markøren alligevel, Apple-token for ofte,
// tom POST uden krop, for store metadata, ingen begrænsning på tilmeldinger.
import { WorkerEntrypoint } from 'cloudflare:workers';
import { gyldigtEndpoint, rensEmner, endpointId, nyeArtikler, valgtArtikel, beskedFor, vapidToken, metadataPasser } from './logik.mjs';

const OPRINDELSER = ['https://techfeedwatch.com', 'http://localhost:4399'];
// Gratis plan: højst 50 udgående forespørgsler pr. kald (artikellisten + 40 beskeder + reserve).
const PORTION = 40;
const LEVETID = 180 * 86400;
const STANDARD = { title: 'TechFeedWatch', body: 'New articles are waiting for you.', url: '/latest/' };

const cors = (req) => {
  const o = req.headers.get('origin');
  return { 'access-control-allow-origin': OPRINDELSER.includes(o) ? o : OPRINDELSER[0], 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' };
};
const svar = (data, status, req) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors(req) } });
const dag = (nu, foer = 0) => new Date(nu.getTime() - foer * 864e5).toISOString().slice(0, 10);

async function hentArtikler() {
  const r = await fetch('https://techfeedwatch.com/videos-lite.json', { cf: { cacheTtl: 300 } });
  if (!r.ok) throw new Error(`videos-lite.json: ${r.status}`);
  return r.json();
}
// Gårsdagens udsendelse er skrevet for et døgn siden - ingen risiko for forældet læsning.
async function gaarsdagens(env, nu) {
  const st = await env.SUBS.get('koersel:' + dag(nu, 1), 'json');
  return (st && st.artikler) || [];
}
async function dagensNye(env, nu) {
  return nyeArtikler(await hentArtikler(), nu, await gaarsdagens(env, nu));
}

async function laesKrop(req) {
  const t = await req.text();
  if (t.length > 4000) return null;
  try { return JSON.parse(t); } catch { return null; }
}

// VAPID-token pr. push-tjeneste, genbrugt i 11 timer (tokenet gælder 12).
async function token(env, aud, cache) {
  if (cache[aud]) return cache[aud];
  const noegle = 'jwt:' + aud;
  let t = await env.SUBS.get(noegle);
  if (!t) {
    t = await vapidToken(JSON.parse(env.VAPID_PRIVATE_JWK), aud);
    await env.SUBS.put(noegle, t, { expirationTtl: 11 * 3600 });
  }
  return (cache[aud] = t);
}

// Ét "bank på" til én push-adresse: 'sendt', 'fjern' (404/410 = slået fra) eller 'fejl <kode>'.
async function sendTil(env, endpoint, cache) {
  const aud = new URL(endpoint).origin;
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `vapid t=${await token(env, aud, cache)}, k=${env.VAPID_PUBLIC}`, ttl: '86400', urgency: 'normal' },
    body: new Uint8Array(0),
  });
  if (r.status === 404 || r.status === 410) return 'fjern';
  return r.ok ? 'sendt' : `fejl ${r.status} ${aud}`;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });

    if (req.method === 'POST' && (url.pathname === '/subscribe' || url.pathname === '/unsubscribe')) {
      if (!OPRINDELSER.includes(req.headers.get('origin'))) return svar({ fejl: 'oprindelse' }, 403, req);
      // Begrænsning: højst 10 pr. minut pr. afsender. IP'en bruges kun til tællingen og gemmes ikke.
      if (env.BEGRAENS) {
        const { success } = await env.BEGRAENS.limit({ key: req.headers.get('cf-connecting-ip') || 'ukendt' });
        if (!success) return svar({ fejl: 'for mange' }, 429, req);
      }
      const d = await laesKrop(req);
      const endpoint = url.pathname === '/subscribe' ? d?.subscription?.endpoint : d?.endpoint;
      if (!gyldigtEndpoint(endpoint)) return svar({ fejl: 'push-adresse' }, 400, req);
      const noegle = 's:' + await endpointId(endpoint);
      try {
        if (url.pathname === '/unsubscribe') { await env.SUBS.delete(noegle); return svar({ ok: true }, 200, req); }
        const metadata = { e: endpoint, t: rensEmner(d.topics) };
        if (!metadataPasser(metadata)) return svar({ fejl: 'for stor' }, 400, req);
        await env.SUBS.put(noegle, '1', { metadata, expirationTtl: LEVETID });
        return svar({ ok: true }, 200, req);
      } catch { return svar({ fejl: 'lager' }, 500, req); }
    }

    if (req.method === 'GET' && url.pathname === '/besked') {
      const id = url.searchParams.get('id') || '';
      if (!/^[0-9a-f]{64}$/.test(id)) return svar(STANDARD, 200, req);
      try {
        const { metadata } = await env.SUBS.getWithMetadata('s:' + id);
        if (!metadata) return svar(STANDARD, 200, req);
        const emner = metadata.t || [];
        const a = valgtArtikel(await dagensNye(env, new Date()), emner);
        return svar(a ? beskedFor(a, emner) : STANDARD, 200, req);
      } catch { return svar(STANDARD, 200, req); }
    }
    return new Response('Not found', { status: 404 });
  },
};

// Kaldes kun af tfw-starter (service binding). Én portion pr. kald. Tilstanden sendes med fra kald til
// kald (forrige), så den aldrig læses forældet fra KV midt i en udsendelse. KV bruges kun som vagt mellem
// dagens tidspunkter (16:37, 17:37 ...), så ingen får to beskeder samme dag.
export class Sender extends WorkerEntrypoint {
  async sendPortion(forrige = null) {
    const env = this.env, nu = new Date();
    const noegle = 'koersel:' + dag(nu);
    let st = forrige || (await env.SUBS.get(noegle, 'json'));
    if (st && st.faerdig) return { ...st, allerede: true };
    const nye = await dagensNye(env, nu);
    if (!st) st = { cursor: null, sendt: 0, sprunget: 0, fjernet: 0, fejl: 0, portioner: 0, sendtIPortion: [], artikler: nye.map((a) => a.slug) };
    const gem = () => env.SUBS.put(noegle, JSON.stringify(st), { expirationTtl: 3 * 86400 });
    if (!nye.length) { st.faerdig = true; st.ingenNye = true; await gem(); return st; }

    const liste = await env.SUBS.list({ prefix: 's:', limit: PORTION, ...(st.cursor ? { cursor: st.cursor } : {}) });
    const allerede = new Set(st.sendtIPortion || []);
    const sendtNu = [...allerede];
    const cache = {};
    for (const k of liste.keys) {
      if (allerede.has(k.name)) continue; // fik den i et afbrudt forsøg på samme portion
      const m = k.metadata || {};
      if (!m.e || !valgtArtikel(nye, m.t || [])) { st.sprunget++; continue; }
      try {
        const res = await sendTil(env, m.e, cache);
        if (res === 'fjern') { await env.SUBS.delete(k.name); st.fjernet++; }
        else if (res === 'sendt') { st.sendt++; sendtNu.push(k.name); }
        else { st.fejl++; st.sidsteFejl = res; }
      } catch (e) {
        const tekst = String(e.message || e);
        // Grænsen for udgående forespørgsler: stop UDEN at flytte markøren. Næste kald tager resten
        // af samme portion og springer dem over, der allerede har fået beskeden.
        if (/subrequest/i.test(tekst)) { st.sendtIPortion = sendtNu; st.afbrudt = true; await gem(); return st; }
        st.fejl++; st.sidsteFejl = tekst.slice(0, 120);
      }
    }
    st.portioner++;
    st.afbrudt = false;
    st.sendtIPortion = [];
    st.cursor = liste.list_complete ? null : liste.cursor;
    st.faerdig = liste.list_complete;
    await gem();
    return st;
  }
}
