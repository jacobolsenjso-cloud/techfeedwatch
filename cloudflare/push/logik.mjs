// Ren logik for push-beskeder (17/10-2026). Ingen Cloudflare-afhængigheder, så den kan testes i Node.
//
// Valg (Jacob, A): højst ÉN besked om dagen pr. læser - den nyeste artikel fra det sidste døgn
// i de emner, læseren følger (følger man intet: alle emner). Ingen ny artikel = ingen besked.

// Kun rigtige push-tjenester må gemmes som modtager - ellers kunne nogen få Workeren til at
// sende forespørgsler til en vilkårlig adresse.
const TILLADTE_VAERTER = [
  /^fcm\.googleapis\.com$/,                 // Chrome, Edge, Android
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^web\.push\.apple\.com$/,                // Safari, iPhone, Mac
  /^[a-z0-9-]+\.notify\.windows\.com$/,     // Edge på Windows (WNS)
  /^[a-z0-9-]+\.push\.apple\.com$/,
];
export function gyldigtEndpoint(endpoint) {
  try {
    const u = new URL(String(endpoint));
    return u.protocol === 'https:' && String(endpoint).length <= 600 && TILLADTE_VAERTER.some((re) => re.test(u.hostname));
  } catch { return false; }
}

// Emner fra læseren: kun korte tekster, højst 18 (sitets antal).
export function rensEmner(emner) {
  if (!Array.isArray(emner)) return [];
  return [...new Set(emner.filter((e) => typeof e === 'string' && e.length > 0 && e.length <= 40))].slice(0, 18);
}

// SHA-256 af endpoint som hex - samme id i Workeren og i sitets service worker.
export async function endpointId(endpoint) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(endpoint)));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Artikler fra det sidste døgn (dato er en ren dag, "2026-10-17"): i dag og i går (UTC), nyeste først.
// allerede: slugs der var med i GÅRSDAGENS udsendelse - de sendes ikke igen (review 17/10: uden det
// kunne en læser med et smalt emne få samme artikel to dage i træk).
export function nyeArtikler(alle, nu = new Date(), allerede = []) {
  const idag = nu.toISOString().slice(0, 10);
  const igaar = new Date(nu.getTime() - 864e5).toISOString().slice(0, 10);
  return alle.filter((a) => !a.isShort && [idag, igaar].includes(String(a.date).slice(0, 10)) && !allerede.includes(a.slug))
    // Samme dato: sorter på navnet, så udsendelsen og /besked altid vælger samme artikel
    // (rækkefølgen i artikellisten kan skifte fra byg til byg).
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.slug).localeCompare(String(b.slug)));
}

// KV-metadata må højst være 1024 bytes - push-adresse + emner skal kunne være der.
export function metadataPasser(md) { return new TextEncoder().encode(JSON.stringify(md)).length <= 1000; }

// Den artikel en læser skal have i dag - eller null.
export function valgtArtikel(nye, emner) {
  if (!emner.length) return nye[0] || null;
  return nye.find((a) => (a.tags || []).some((t) => emner.includes(t))) || null;
}

// Beskedens tekst. Emnet: det fulgte mærke, hvis læseren følger et, ellers artiklens første.
export function beskedFor(a, emner = []) {
  const emne = (a.tags || []).find((t) => emner.includes(t)) || (a.tags || [])[0] || 'Tech';
  return {
    title: String(a.title).slice(0, 120),
    body: `New in ${emne}${a.minutesRead ? ` · ${a.minutesRead} min read` : ''}`,
    url: `/video/${a.slug}/`,
  };
}

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// VAPID-token (ES256). WebCrypto giver signaturen i r||s-form, som JWT kræver.
export async function vapidToken(privatJwk, aud, sub = 'https://techfeedwatch.com', nu = Date.now()) {
  const enc = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const indhold = `${enc({ typ: 'JWT', alg: 'ES256' })}.${enc({ aud, exp: Math.floor(nu / 1000) + 12 * 3600, sub })}`;
  const noegle = await crypto.subtle.importKey('jwk', privatJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, noegle, new TextEncoder().encode(indhold));
  return `${indhold}.${b64u(sig)}`;
}
