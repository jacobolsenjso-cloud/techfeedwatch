// Godkend-siden (16/11-2026): gemmer Jacobs OK/Fejl pr. artikel i Cloudflare KV (binding GODKEND).
// Låst to gange: (1) Cloudflare Access foran /godkend og /api/godkend (kun Jacobs Google-konto) og
// (2) her: Access' underskrevne billet (Cf-Access-Jwt-Assertion) tjekkes mod Access' offentlige nøgler,
// målgruppen (ACCESS_AUD) og e-mailen (GODKEND_EMAIL). Uden gyldig billet svarer den 403 - også hvis
// Access en dag er slået fra ved en fejl. Indstillinger (ikke hemmelige, men holdt ude af det offentlige
// repo): ACCESS_TEAM, ACCESS_AUD, GODKEND_EMAIL i Pages-projektets miljøvariabler.
//
// GET  /api/godkend -> { slug: { status, grund, tid } , ... }
// POST /api/godkend  { slug, status: "ok"|"fejl", grund } -> { status, grund, tid }

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
let noegler = null; // gemmes mellem kald i samme isolat

async function tjekBillet(request, env) {
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (!jwt || !env.ACCESS_TEAM || !env.ACCESS_AUD || !env.GODKEND_EMAIL) return false;
  const [h, p, s] = jwt.split('.');
  if (!h || !p || !s) return false;
  const hoved = JSON.parse(new TextDecoder().decode(b64url(h)));
  const krop = JSON.parse(new TextDecoder().decode(b64url(p)));
  const udsteder = `https://${env.ACCESS_TEAM}.cloudflareaccess.com`;
  if (!noegler) noegler = (await (await fetch(`${udsteder}/cdn-cgi/access/certs`)).json()).keys || [];
  let jwk = noegler.find((k) => k.kid === hoved.kid);
  if (!jwk) { noegler = (await (await fetch(`${udsteder}/cdn-cgi/access/certs`)).json()).keys || []; jwk = noegler.find((k) => k.kid === hoved.kid); }
  if (!jwk || hoved.alg !== 'RS256') return false;
  const noegle = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const gyldig = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', noegle, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  const aud = Array.isArray(krop.aud) ? krop.aud : [krop.aud];
  return gyldig && krop.iss === udsteder && aud.includes(env.ACCESS_AUD) && krop.exp * 1000 > Date.now()
    && String(krop.email || '').toLowerCase() === String(env.GODKEND_EMAIL).toLowerCase();
}

const svar = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });

export async function onRequest({ request, env }) {
  if (!env.GODKEND) return svar({ fejl: 'KV-bindingen GODKEND mangler' }, 500);
  let ok = false;
  try { ok = await tjekBillet(request, env); } catch { ok = false; }
  if (!ok) return svar({ fejl: 'ikke logget ind' }, 403);

  if (request.method === 'GET') {
    const ud = {};
    let cursor;
    do {
      const side = await env.GODKEND.list({ prefix: 'a:', cursor });
      await Promise.all(side.keys.map(async (k) => { const v = await env.GODKEND.get(k.name, 'json'); if (v) ud[k.name.slice(2)] = v; }));
      cursor = side.list_complete ? null : side.cursor;
    } while (cursor);
    return svar(ud);
  }

  if (request.method === 'POST') {
    let b;
    try { b = await request.json(); } catch { return svar({ fejl: 'ugyldig JSON' }, 400); }
    const slug = String(b.slug || '');
    if (!/^[a-z0-9-]{1,200}$/.test(slug) || !['ok', 'fejl'].includes(b.status)) return svar({ fejl: 'ugyldigt slug eller status' }, 400);
    const grund = b.status === 'fejl' ? String(b.grund || '').slice(0, 300) : '';
    if (b.status === 'fejl' && !grund.trim()) return svar({ fejl: 'skriv en grund' }, 400);
    const v = { status: b.status, grund, tid: new Date().toISOString() };
    await env.GODKEND.put(`a:${slug}`, JSON.stringify(v));
    return svar(v);
  }

  return svar({ fejl: 'kun GET og POST' }, 405);
}
