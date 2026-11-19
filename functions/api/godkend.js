// Godkend-siden (19/11-2026, Jacob: "ingen artikel må gå live, før jeg har godkendt den"): robotten skriver kun
// krypterede KLADDER (src/lib/kladder.mjs, public/_kladder/). Jacob læser dem på /godkend og trykker Godkend,
// Omskriv (med note) eller Afvis. Beslutningen gemmes i Cloudflare KV (binding GODKEND, nøgle b:<kladde-id>), og
// kladder.mjs udfører den inden for en time. (16/11-udgavens OK/Fejl-svar ligger urørt under a: i samme KV.)
// Låst to gange: (1) Cloudflare Access foran /godkend og /api/godkend (kun Jacobs konto) og (2) her: Access'
// underskrevne billet (Cf-Access-Jwt-Assertion) tjekkes mod Access' offentlige nøgler, målgruppen (ACCESS_AUD) og
// e-mailen (GODKEND_EMAIL). Uden gyldig billet: 403 - også hvis Access en dag er slået fra ved en fejl.
// Indstillinger: ACCESS_TEAM, ACCESS_AUD, GODKEND_EMAIL og KLADDE_NOEGLE (Secret) i Pages-projektets variabler.
//
// GET  /api/godkend   -> { kladder: [ ...dekrypteret ], beslutninger: { <id>: { id, version, handling, note, tid } } }
// POST /api/godkend   { id, version, handling: godkend|omskriv|afvis|fortryd, note } -> den gemte beslutning
import { dekrypterJson, krypter, dekrypter } from '../../src/lib/kryptering.mjs';

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
let noegler = null; // gemmes mellem kald i samme isolat

export async function tjekBillet(request, env, hent = fetch) {
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt || !env.ACCESS_TEAM || !env.ACCESS_AUD || !env.GODKEND_EMAIL) return false;
  const [h, p, s] = jwt.split('.');
  if (!h || !p || !s) return false;
  const hoved = JSON.parse(new TextDecoder().decode(b64url(h)));
  const krop = JSON.parse(new TextDecoder().decode(b64url(p)));
  if (hoved.alg !== 'RS256') return false;
  const udsteder = `https://${env.ACCESS_TEAM}.cloudflareaccess.com`;
  const hentNoegler = async () => ((await (await hent(`${udsteder}/cdn-cgi/access/certs`)).json()).keys || []);
  if (!noegler) noegler = await hentNoegler();
  let jwk = noegler.find((k) => k.kid === hoved.kid);
  if (!jwk) { noegler = await hentNoegler(); jwk = noegler.find((k) => k.kid === hoved.kid); }
  if (!jwk) return false;
  const noegle = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const gyldig = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', noegle, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  const aud = Array.isArray(krop.aud) ? krop.aud : [krop.aud];
  return gyldig && krop.iss === udsteder && aud.includes(env.ACCESS_AUD) && krop.exp * 1000 > Date.now()
    && String(krop.email || '').toLowerCase() === String(env.GODKEND_EMAIL).toLowerCase();
}
export const nulstilNoegler = () => { noegler = null; }; // kun til test

export const svar = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
export const HANDLINGER = ['godkend', 'omskriv', 'afvis', 'fortryd'];
export const gyldigtId = (s) => /^[a-f0-9]{16}$/.test(String(s));
const LEVETID = 60 * 86400; // en beslutning ryddes selv efter 60 dage (kladder.mjs har udført den længe før)

// Alle beslutninger fra KV (b:<id>)
export async function alleBeslutninger(env) {
  const ud = {}; let cursor;
  do {
    const side = await env.GODKEND.list({ prefix: 'b:', cursor });
    await Promise.all(side.keys.map(async (k) => { const v = await env.GODKEND.get(k.name, 'json'); if (v) ud[v.id] = v; }));
    cursor = side.list_complete ? null : side.cursor;
  } while (cursor);
  return ud;
}

// Kladderne ligger krypteret som statiske filer på sitet (public/_kladder/) - læses og dekrypteres her
async function kladder(request, env) {
  const hentFil = (sti) => env.ASSETS.fetch(new Request(new URL(sti, request.url)));
  const r = await hentFil('/_kladder/liste.json');
  if (!r.ok) return [];
  const liste = await r.json();
  const ud = [];
  for (const { id } of liste) {
    if (!gyldigtId(id)) continue;
    try {
      const f = await hentFil(`/_kladder/${id}.kladde`);
      const k = await dekrypterJson(await f.text(), env.KLADDE_NOEGLE);
      delete k.markdown; // siden bruger kun visningen
      ud.push(k);
    } catch (e) { ud.push({ id, fejl: `kladden kunne ikke læses (${e.message})` }); }
  }
  return ud.sort((a, b) => String(a.oprettet).localeCompare(String(b.oprettet)));
}

export async function onRequest({ request, env }) {
  if (!env.GODKEND) return svar({ fejl: 'KV-bindingen GODKEND mangler' }, 500);
  if (!env.KLADDE_NOEGLE) return svar({ fejl: 'KLADDE_NOEGLE mangler i Cloudflare' }, 500);
  let ok = false;
  try { ok = await tjekBillet(request, env); } catch { ok = false; }
  if (!ok) return svar({ fejl: 'ikke logget ind' }, 403);

  if (request.method === 'GET') {
    const b = await alleBeslutninger(env);
    for (const v of Object.values(b)) { try { v.note = v.note ? await dekrypter(v.note, env.KLADDE_NOEGLE) : ''; } catch { v.note = ''; } }
    return svar({ kladder: await kladder(request, env), beslutninger: b });
  }

  // POST: kun den nyeste beslutning pr. kladde gemmes. "fortryd" sletter den - virker, indtil kladder.mjs har
  // udført den (højst en time). Noten gemmes KRYPTERET: den offentlige læse-adresse viser den aldrig i klar tekst.
  if (request.method === 'POST') {
    let b;
    try { b = await request.json(); } catch { return svar({ fejl: 'ugyldig JSON' }, 400); }
    const id = String(b.id || ''); const version = Number(b.version);
    if (!gyldigtId(id) || !HANDLINGER.includes(b.handling) || !Number.isInteger(version) || version < 1) return svar({ fejl: 'ugyldigt id, version eller handling' }, 400);
    if (b.handling === 'fortryd') { await env.GODKEND.delete(`b:${id}`); return svar({ id, fortrudt: true }); }
    const note = String(b.note || '').trim().slice(0, 2000);
    if (b.handling === 'omskriv' && note.length < 5) return svar({ fejl: 'skriv, hvad der skal laves om' }, 400);
    const v = { id, version, handling: b.handling, note: note ? await krypter(note, env.KLADDE_NOEGLE) : '', tid: new Date().toISOString() };
    await env.GODKEND.put(`b:${id}`, JSON.stringify(v), { expirationTtl: LEVETID });
    return svar({ ...v, note });
  }

  return svar({ fejl: 'kun GET og POST' }, 405);
}
