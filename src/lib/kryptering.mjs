// Kryptering af kladder (19/11-2026, Jacob: "krypterede kladder på GitHub"). Repoet er offentligt, så en
// kladde, Jacob ikke har godkendt endnu, må ikke kunne læses dér. Robotten krypterer kladden med
// KLADDE_NOEGLE (GitHub-secret), og godkend-siden (functions/api/godkend.js) dekrypterer den med samme
// nøgle (Cloudflare-secret). Uden nøglen er filen tegnrod.
// AES-256-GCM via WebCrypto - findes både i Node 22 og i Cloudflare, så præcis samme kode bruges begge steder.
// Format: "tfwk1:" + base64(iv 12 byte + krypteret tekst + kontrolmærke 16 byte). GCM opdager, hvis nogen har
// ændret filen: så fejler dekrypteringen i stedet for at give forkert tekst.
const PRAEFIKS = 'tfwk1:';
const tilB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const fraB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function noegle(noegleB64) {
  const raa = fraB64(String(noegleB64 || '').trim());
  if (raa.length !== 32) throw new Error('KLADDE_NOEGLE mangler eller er ikke 32 byte (base64)');
  return crypto.subtle.importKey('raw', raa, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function krypter(tekst, noegleB64) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ud = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await noegle(noegleB64), new TextEncoder().encode(String(tekst))));
  const alt = new Uint8Array(12 + ud.length); alt.set(iv); alt.set(ud, 12);
  return PRAEFIKS + tilB64(alt);
}

export async function dekrypter(data, noegleB64) {
  const s = String(data || '').trim();
  if (!s.startsWith(PRAEFIKS)) throw new Error('ikke en krypteret kladde');
  const alt = fraB64(s.slice(PRAEFIKS.length));
  const ud = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: alt.subarray(0, 12) }, await noegle(noegleB64), alt.subarray(12));
  return new TextDecoder().decode(ud);
}

export const krypterJson = (obj, n) => krypter(JSON.stringify(obj), n);
export const dekrypterJson = async (data, n) => JSON.parse(await dekrypter(data, n));
