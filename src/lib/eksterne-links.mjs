// Eksterne links i robottens artikler — aftalt med Jacob 23/9.
//
// Målt 23/9: 391 af 396 artikler havde INGEN eksterne links. Et link til den
// ægte kilde gør en artikel troværdig for læseren, for Google og for den, der
// vurderer sitet til AdSense. Men et forkert link skader mere end intet link,
// så reglerne er stramme:
//
//  A) Højst 3 links fra videoens EGEN beskrivelse på YouTube (ægte kilder,
//     som robotten ikke har fundet på).
//  B) Højst 2 officielle sider for noget, artiklen selv nævner ved navn
//     (fx "IBM Quantum" -> IBM's side). Gemini foreslår adressen; vi stoler
//     ikke på den: domænet skal indeholde navnet, siden skal svare, og dens
//     titel skal indeholde navnet.
//  - Højst 5 i alt, ét pr. domæne.
//  - Hvert link hentes live. Svarer det ikke med en HTML-side, udelades det.
//  - Ingen forkortere (bit.ly ...), ingen affiliate/rabat/sponsor-links,
//    ingen sociale medier eller butikker.
//  - Linket sættes kun på et navn, der ALLEREDE står i brødteksten. Står
//    navnet der ikke, handler artiklen ikke om det, og linket udelades.
//    Ingen ord ændres.
//
// Kan aldrig stoppe robotten: alt er i try/catch, og ved fejl returneres
// artiklen uændret.

const UA = 'techfeedwatch-robot/1.0 (+https://techfeedwatch.com)';
const MAX_BESKRIVELSE = 3;
const MAX_OFFICIEL = 2;
const MAX_I_ALT = 5;

const FORKORTERE = /(^|\.)(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|buff\.ly|rebrand\.ly|cutt\.ly|is\.gd|amzn\.to|geni\.us|linktr\.ee|lnk\.to|bitdefend\.me|shorturl\.at|tiny\.cc|rb\.gy|s\.id|bl\.ink|dub\.sh|shor\.by|smarturl\.it|hyperurl\.co|kit\.co|beacons\.ai|stan\.store|bio\.link)$/i;
const PLATFORME = /(^|\.)(youtube\.com|youtu\.be|instagram\.com|facebook\.com|fb\.com|fb\.me|twitter\.com|x\.com|tiktok\.com|linkedin\.com|discord\.gg|discord\.com|patreon\.com|t\.me|telegram\.me|whatsapp\.com|reddit\.com|threads\.net|spotify\.com|podcasts\.apple\.com|snapchat\.com|twitch\.tv|gumroad\.com|amazon\.[a-z.]+|etsy\.com|ko-fi\.com|buymeacoffee\.com|calendly\.com|skool\.com|kajabi\.com|teachable\.com|systeme\.io|whop\.com|techfeedwatch\.com|docs\.google\.com|drive\.google\.com|forms\.gle|google\.com\/url)$/i;
const AFFILIATE_URL = /[?&](ref|referral|aff|affiliate|affid|partner|via|fpr|sscid|irclickid|clickid|coupon|promo|discount|tag|campaign_id)=|\/(ref|go|r|aff|affiliate|partners?|refer|coupon|deal|deals|promo)\//i;
const SPONSOR_LINJE = /sponsor|sponsored|affiliate|partner link|use code|coupon|promo code|discount|% off|\bdeal\b|commission|paid link|#ad\b|get \d+ ?%/i;

const ORD_STOP = new Set(['the','a','an','of','for','to','in','on','and','or','with','is','are','by','at','from','home','official','site','website','page','welcome','inc','llc','ltd','co']);

// Registrerbart navn: "quantum.cloud.ibm.com" -> "ibm", "arvow.com" -> "arvow".
function hovedNavn(host) {
  const dele = host.toLowerCase().replace(/^www\./, '').split('.');
  if (dele.length >= 3 && /^(co|com|org|net|ac|gov)$/.test(dele[dele.length - 2])) return dele[dele.length - 3];
  return dele.length >= 2 ? dele[dele.length - 2] : dele[0];
}

function renUrl(u) {
  const url = new URL(u);
  for (const k of [...url.searchParams.keys()]) if (/^utm_|^(si|fbclid|gclid|mc_[a-z]+)$/i.test(k)) url.searchParams.delete(k);
  url.hash = '';
  return url.toString();
}

function blokeret(u) {
  let url;
  try { url = new URL(u); } catch { return 'ugyldig'; }
  if (!/^https?:$/.test(url.protocol)) return 'ikke http';
  const host = url.hostname.toLowerCase();
  if (FORKORTERE.test(host)) return 'forkorter';
  if (PLATFORME.test(host) || PLATFORME.test(host + url.pathname)) return 'platform';
  if (AFFILIATE_URL.test(u)) return 'affiliate';
  return null;
}

// Henter siden: kun 2xx HTML tæller. Returnerer { url (efter omdirigering), titel } eller null.
async function hentSide(u, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(u, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA, accept: 'text/html' } });
    if (!res.ok) return null;
    if (!/text\/html/i.test(res.headers.get('content-type') || '')) return null;
    const html = (await res.text()).slice(0, 300000);
    const titel = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
      .replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
    return { url: res.url || u, titel };
  } catch { return null; }
  finally { clearTimeout(t); }
}

// Linjer i brødteksten, hvor et link må sættes (samme regel som de interne links).
const tilladt = (l) => { const t = l.trim(); return t && !/^(#|\||```|>|!\[|<)/.test(t); };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Finder første forekomst af navnet i brødteksten, uden for eksisterende links.
function findSted(linjer, navn, brugteLinjer) {
  if (!navn || navn.length < 3) return null;
  const re = new RegExp(`(?<![A-Za-z0-9-])${esc(navn).replace(/\s+/g, '\\s+')}(?![A-Za-z0-9-])`, 'i');
  for (let i = 0; i < linjer.length; i++) {
    if (!tilladt(linjer[i]) || brugteLinjer.has(i)) continue;
    const renset = linjer[i].replace(/\[[^\]]*\]\([^)]*\)/g, (x) => ' '.repeat(x.length));
    const m = renset.match(re);
    if (m) return { linje: i, start: m.index, tekst: linjer[i].substr(m.index, m[0].length) };
  }
  return null;
}

// Mulige ankertekster for en side fra beskrivelsen: dele af sidens titel
// (delt ved | - – : ·) på 1-5 ord, længste først, og til sidst domænets navn.
function ankerKandidater(titel, host) {
  const ud = [];
  // Ét ord alene fra en titel ("Pricing", "Blog") er for løst; kun domænets
  // eget navn må stå alene. Og mindst ét ord skal være andet end fyldord.
  const GENERISK = new Set([...ORD_STOP, 'get','started','free','tool','tools','pricing','price','blog','docs','documentation','login','sign','up','about','contact','news','best','new','ai','app','apps','online','download','guide','learn','more','your','our','how','what']);
  for (const del of (titel || '').split(/\s[|\-–—:·]\s|\s\|\s|:\s/)) {
    const d = del.trim();
    const ord = d.split(/\s+/).filter(Boolean);
    if (ord.length >= 2 && ord.length <= 5 && ord.some((w) => !GENERISK.has(w.toLowerCase()))) ud.push(d);
  }
  ud.sort((a, b) => b.length - a.length);
  const hn = hovedNavn(host);
  if (hn.length >= 4) ud.push(hn);
  return ud;
}

function saetInd(linjer, sted, url) {
  const l = linjer[sted.linje];
  linjer[sted.linje] = `${l.slice(0, sted.start)}[${sted.tekst}](${url})${l.slice(sted.start + sted.tekst.length)}`;
}

export async function tilfoejEksterneLinks(content, { beskrivelse = '', spoerg = null, log = console.log } = {}) {
  try {
    const linjer = content.split('\n');
    const brugteLinjer = new Set();
    const brugteDomaener = new Set();
    const sat = [];
    const afvist = [];

    // Domæner, artiklen allerede linker til, tæller som brugt.
    for (const m of content.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) { try { brugteDomaener.add(hovedNavn(new URL(m[1]).hostname)); } catch {} }

    // A) Videoens egen beskrivelse
    const kandidaterA = [];
    for (const linje of String(beskrivelse).split('\n')) {
      const urls = linje.match(/https?:\/\/[^\s)<>"']+/g) || [];
      for (const raa of urls) {
        const u = raa.replace(/[.,;!?]+$/, '');
        if (SPONSOR_LINJE.test(linje)) { afvist.push(`${u} (sponsor-linje)`); continue; }
        const b = blokeret(u);
        if (b) { afvist.push(`${u} (${b})`); continue; }
        kandidaterA.push(u);
      }
    }
    let antalA = 0;
    for (const u of [...new Set(kandidaterA)].slice(0, 12)) {
      if (antalA >= MAX_BESKRIVELSE || sat.length >= MAX_I_ALT) break;
      const side = await hentSide(u);
      if (!side) { afvist.push(`${u} (svarer ikke)`); continue; }
      const b2 = blokeret(side.url);
      if (b2) { afvist.push(`${u} -> ${side.url} (${b2} efter omdirigering)`); continue; }
      const host = new URL(side.url).hostname;
      if (brugteDomaener.has(hovedNavn(host))) continue;
      let sted = null;
      for (const a of ankerKandidater(side.titel, host)) { sted = findSted(linjer, a, brugteLinjer); if (sted) break; }
      if (!sted) { afvist.push(`${u} (navnet står ikke i artiklen)`); continue; }
      const ren = renUrl(side.url);
      saetInd(linjer, sted, ren);
      brugteLinjer.add(sted.linje); brugteDomaener.add(hovedNavn(host));
      sat.push({ kilde: 'beskrivelse', anker: sted.tekst, url: ren });
      antalA++;
    }

    // B) Officielle sider for navne i artiklen
    if (spoerg && sat.length < MAX_I_ALT) {
      let forslag = [];
      try {
        const svar = await spoerg(`List up to 4 products, companies, organizations or open-source projects that the article below mentions BY NAME and that have an official website. Use only names written in the article. Give the official homepage or official product page. Only include one if you are certain of the exact official domain. Answer with JSON only, no prose: [{"name": "...", "url": "https://..."}]\n\nARTICLE:\n${content.slice(0, 12000)}`);
        forslag = JSON.parse((svar.match(/\[[\s\S]*\]/) || ['[]'])[0]);
      } catch (e) { log(`🔗 Officielle sider: intet svar (${e.message})`); }
      let antalB = 0;
      for (const f of Array.isArray(forslag) ? forslag : []) {
        if (antalB >= MAX_OFFICIEL || sat.length >= MAX_I_ALT) break;
        const navn = String(f?.name || '').trim();
        const u = String(f?.url || '').trim();
        if (!navn || !u) continue;
        const b = blokeret(u);
        if (b) { afvist.push(`${u} (${b})`); continue; }
        const navneOrd = navn.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !ORD_STOP.has(w));
        let host;
        try { host = new URL(u).hostname; } catch { continue; }
        const hn = hovedNavn(host);
        // Domænet skal bære navnet: "IBM Quantum" -> ibm.com, "Arvow" -> arvow.com.
        if (!navneOrd.some((w) => (w.length >= 3 && hn.includes(w)) || (hn.length >= 3 && w.includes(hn)))) { afvist.push(`${u} (domænet passer ikke til "${navn}")`); continue; }
        if (brugteDomaener.has(hn)) continue;
        const sted = findSted(linjer, navn, brugteLinjer);
        if (!sted) { afvist.push(`${u} ("${navn}" står ikke i artiklen)`); continue; }
        const side = await hentSide(u);
        if (!side) { afvist.push(`${u} (svarer ikke)`); continue; }
        if (blokeret(side.url) || hovedNavn(new URL(side.url).hostname) !== hn) { afvist.push(`${u} (omdirigerer væk)`); continue; }
        const t = side.titel.toLowerCase();
        if (!navneOrd.some((w) => t.includes(w))) { afvist.push(`${u} (sidens titel nævner ikke "${navn}")`); continue; }
        const ren = renUrl(side.url);
        saetInd(linjer, sted, ren);
        brugteLinjer.add(sted.linje); brugteDomaener.add(hn);
        sat.push({ kilde: 'officiel', anker: sted.tekst, url: ren });
        antalB++;
      }
    }

    log(`🔗 Eksterne links: ${sat.length} sat (${sat.map((s) => `${s.anker} → ${new URL(s.url).hostname}`).join(', ') || 'ingen'})` +
      (afvist.length ? ` · ${afvist.length} afvist` : ''));
    for (const a of afvist.slice(0, 10)) log(`   afvist: ${a}`);
    return { content: linjer.join('\n'), sat, afvist };
  } catch (e) {
    log(`🔗 Eksterne links sprunget over (${e.message}) — artiklen udgives uden`);
    return { content, sat: [], afvist: [] };
  }
}
