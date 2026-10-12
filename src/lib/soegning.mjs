// Søgning først (fase B, 12/10-2026): før artiklen skrives, undersøger Gemini
// selve Google-søgningen — hvilke delspørgsmål en søger har brug for svar på, og
// hvilke fakta de bedste sider giver (med kilde). Videoen bliver et supplement.
//
// Hvorfor: målt 12/10 (fase A) var 69 % af de 10 nyeste artikler videoens indhold,
// og 77 % af tallene stod uden navngiven kilde. Artiklen skal svare på søgningen,
// ikke genfortælle én video.
//
// Hvert faktum beholdes KUN, hvis Googles egne kildehenvisninger (grounding)
// peger på en side bag det. Et faktum uden side bag sig kasseres — det er
// modellens egen påstand, ikke en kilde.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { GEMINI_MODEL } from './model.mjs';

export const MIN_FAKTA_SOEG = 4;   // så mange fakta med kilde, ellers ingen artikel
export const MIN_KILDER_SOEG = 2;  // så mange forskellige sider bag dem
const CACHE = './.cache/soegning';
const CACHE_VERSION = 2; // hæves, når søgningens regler ændres

export function soegPrompt(spoergsmaal, dato) {
  return `You are a researcher preparing a reference article that answers the Google search "${spoergsmaal}". Today is ${dato}.
Search Google and study what the top-ranking pages cover for this search.

Return EXACTLY this format and nothing else:
SUBQUESTIONS:
1. <the search question itself, written as a correct English question>
2. <another question a searcher needs answered to fully understand the answer>
(4 to 6 questions in total, in the order a reader needs them)
FACTS:
- <one fact per line: a full sentence that names its publisher (for example "According to IBM's Cost of a Data Breach Report 2024, ...") and gives numbers, dates and names exactly as the page states them>
(8 to 15 facts that help answer the questions; prefer the most recent figures and primary sources: official sites, research, standards bodies, the company concerned. No forums, no social media, no YouTube.)`;
}

// Deler modellens svar i delspørgsmål og fakta.
export function parseSoegning(tekst) {
  const s = String(tekst || '').replace(/\r/g, '');
  const del = (navn, naeste) => {
    const m = s.match(new RegExp(`${navn}:?\\**\\s*\\n([\\s\\S]*?)(?=\\n\\s*\\**(${naeste}):|$)`, 'i'));
    return m ? m[1] : '';
  };
  const delspoergsmaal = del('SUBQUESTIONS', 'FACTS').split('\n')
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').replace(/\*\*/g, '').trim()).filter((l) => l.length > 8 && /\?$/.test(l)).slice(0, 6);
  const fakta = del('FACTS', 'SUBQUESTIONS').split('\n')
    .filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, '').replace(/\*\*/g, '').trim()).filter((l) => l.length > 25);
  return { delspoergsmaal, fakta };
}

// Hvilke sider (grounding-chunks) står bag en linje? Googles henvisninger
// (groundingSupports) dækker tekststykker i svaret; en linje får de sider,
// hvis tekststykke ligger i linjen (eller omvendt).
export function kilderTilLinje(linje, supports) {
  // Googles tekststykker kan indeholde punkttegn ("- "), overskriften "FACTS:" og
  // flere linjer (målt 12/10: 0 af 12 fakta matchede, før begge sider blev renset ens).
  const ren = (x) => String(x || '').replace(/\*\*/g, '').replace(/^\s*(SUBQUESTIONS|FACTS):?\s*$/gim, '')
    .replace(/^\s*([-*]|\d+[.)])\s+/gm, '').replace(/\s+/g, ' ').trim();
  const l = ren(linje);
  const idx = new Set();
  for (const s of supports || []) {
    for (const stykke of String(s.segment?.text || '').split('\n')) {
      const seg = ren(stykke);
      if (seg.length < 15) continue;
      if (l.includes(seg) || seg.includes(l)) for (const i of s.groundingChunkIndices || []) idx.add(i);
    }
  }
  return [...idx];
}

// Googles kildelinks er omdirigeringer (vertexaisearch...). Den rigtige adresse
// står i Location-headeren. Fejler opslaget, bruges sidens domæne alene.
async function rigtigAdresse(uri) {
  try {
    const r = await fetch(uri, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
    const loc = r.headers.get('location');
    if (loc && /^https?:\/\//.test(loc)) return loc;
  } catch { /* falder tilbage nedenfor */ }
  return null;
}

// Sidens titel til kildelisten. Bedste forsøg: mange sider afviser maskiner.
async function sideTitel(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; TechFeedWatchBot/1.0; +https://techfeedwatch.com)' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 200000);
    const t = html.match(/<title[^>]*>([^<]{5,200})<\/title>/i)?.[1];
    return t ? t.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim() : null;
  } catch { return null; }
}

// Kildens navn i teksten: domænets første led ("ibm.com" -> "ibm"). Bruges til
// at se, om en sætning med et tal nævner, hvor tallet kommer fra.
export function domaeneLed(domaene) {
  const d = String(domaene || '').toLowerCase().replace(/^www\./, '');
  const dele = d.split('.');
  // "legislation.gov.uk" -> "legislation", ikke "gov" (målt 12/10)
  if (dele.length >= 3 && dele[dele.length - 1].length === 2 && /^(co|com|gov|org|ac|net|edu)$/.test(dele[dele.length - 2])) return dele[dele.length - 3];
  const led = dele.length >= 2 ? dele[dele.length - 2] : d;
  // "research.google" -> "google": et almindeligt ord kan ikke være et kildenavn,
  // ellers tæller enhver sætning med "research" som navngivet (målt 12/10).
  if (GENERISKE_LED.has(led)) return dele.length >= 2 && !GENERISKE_LED.has(dele[dele.length - 1]) && dele[dele.length - 1].length > 3 ? dele[dele.length - 1] : '';
  return led;
}
const GENERISKE_LED = new Set(['research', 'news', 'blog', 'data', 'science', 'tech', 'info', 'help', 'support', 'docs', 'learn', 'insights', 'about', 'home', 'online', 'web', 'cloud', 'security', 'privacy']);

// Sider, der ikke må være kilde: genudgivelser af andres dokumenter, fora og
// sociale medier. Målt 12/10: Scribd stod som kilde til IBM's rapport.
const IKKE_KILDE = /(^|\.)(scribd|docplayer|slideshare|coursehero|studocu|reddit|quora|youtube|facebook|instagram|tiktok|pinterest|x|twitter|linkedin)\.(com|net|org)$/;
export const erKildeTilladt = (vaert) => !IKKE_KILDE.test(String(vaert || '').toLowerCase().replace(/^www\./, ''));

// Udgivernavne, som fakta-sætningerne selv bruger ("According to IBM's ...").
export function udgivernavne(fakta) {
  const ud = new Set();
  for (const f of fakta) {
    const t = f.tekst || f;
    // "According to IBM's Cost of ..." -> "IBM" (alt efter 's skæres af)
    for (const m of t.matchAll(/(?:According to|Per|per)\s+(?:the\s+)?([A-Z][\w&.'’-]*(?:\s+(?:of\s+)?[A-Z][\w&.'’-]*){0,4})/g)) ud.add(m[1].split(/['’]s\b/)[0].trim());
    for (const m of t.matchAll(/\b([A-Z][\w&.-]+(?:\s+[A-Z][\w&.-]+){0,3})['’]s?\s+(?:\d{4}\s+)?(?:report|study|survey|data|research|analysis|guidance|definition|index)/g)) ud.add(m[1].trim());
    // Forkortelser i parentes: "(NIST)", "(GDPR)"
    for (const m of t.matchAll(/\(([A-Z][A-Za-z]{1,7})\)/g)) ud.add(m[1]);
  }
  const GENERISK = new Set(['Article', 'Section', 'The', 'According', 'Report', 'Data']);
  return [...ud].filter((n) => n.length >= 2 && !GENERISK.has(n));
}

// Hovedfunktionen. Resultatet gemmes pr. spørgsmål i .cache/soegning (3 dage),
// så robottens kandidat-runde og en genkørsel ikke betaler for samme søgning to gange.
// Giver søgningen for få delspørgsmål, fakta med kilde eller kilder, får
// resultatet forTynd: true — så skrives ingen artikel.
export async function undersoegSoegning(genAI, spoergsmaal, { onLog = () => {}, hentModel, udenCache = false } = {}) {
  // Versionen indgår i nøglen: ændres søgningens regler, bruges en gammel cache ikke
  // (12/10: første prøve læste en cache fra før Scribd blev spærret som kilde).
  const noegle = crypto.createHash('sha1').update(`v${CACHE_VERSION}:${spoergsmaal.toLowerCase().trim()}`).digest('hex').slice(0, 16);
  const sti = `${CACHE}/${noegle}.json`;
  if (!udenCache) try {
    const c = JSON.parse(fs.readFileSync(sti, 'utf8'));
    if (Date.now() - new Date(c.hentet).getTime() < 3 * 864e5) { onLog(`Søgning: læst fra cache (${c.fakta.length} fakta, ${c.kilder.length} kilder)`); return { ...c, fraCache: true }; }
  } catch { /* ingen cache */ }

  const dato = new Date().toISOString().slice(0, 10);
  const model = hentModel(genAI, { model: GEMINI_MODEL, tools: [{ googleSearch: {} }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192 } });
  const r = await model.generateContent(soegPrompt(spoergsmaal, dato));
  const kand = r.response.candidates?.[0];
  const tekst = r.response.text() || '';
  const g = kand?.groundingMetadata || {};
  const chunks = g.groundingChunks || [];
  const { delspoergsmaal, fakta: raa } = parseSoegning(tekst);

  // Kun fakta med mindst én side bag sig. Sidernes nr. tildeles i den rækkefølge, de bruges.
  const kildeNr = new Map(); // chunk-indeks -> kildenr (1..)
  const fakta = [];
  for (const linje of raa) {
    const idx = kilderTilLinje(linje, g.groundingSupports).filter((i) => chunks[i]?.web?.uri);
    if (!idx.length) continue;
    for (const i of idx) if (!kildeNr.has(i)) kildeNr.set(i, kildeNr.size + 1);
    fakta.push({ nr: fakta.length + 1, tekst: linje, kilder: [...new Set(idx.map((i) => kildeNr.get(i)))] });
  }
  const kilder = [];
  for (const [i, nr] of kildeNr) {
    const w = chunks[i].web;
    let url = (await rigtigAdresse(w.uri)) || null;
    const domaene = String(w.title || (url ? new URL(url).hostname : '')).replace(/^www\./, '');
    // Forbudt kilde eller samme adresse to gange: siden tæller ikke (dens fakta falder fra nedenfor)
    if (url && (!erKildeTilladt(new URL(url).hostname) || kilder.some((k) => k.url === url))) url = null;
    kilder.push({ nr, domaene, url, titel: url ? await sideTitel(url) : null });
  }
  // Kilder uden rigtig adresse kan ikke stå i kildelisten — deres fakta må heller ikke bruges.
  // Gyldige kilder nummereres om (1, 2, 3 …), og hvert faktum peger kun på gyldige.
  const nyNr = new Map(kilder.filter((k) => k.url).map((k, i) => [k.nr, i + 1]));
  const kilder2 = kilder.filter((k) => nyNr.has(k.nr)).map((k) => ({ ...k, nr: nyNr.get(k.nr) }));
  const fakta2 = fakta.map((f) => ({ ...f, kilder: f.kilder.filter((n) => nyNr.has(n)).map((n) => nyNr.get(n)) }))
    .filter((f) => f.kilder.length).map((f, i) => ({ ...f, nr: i + 1 }));
  const res = {
    spoergsmaal, hentet: new Date().toISOString(), delspoergsmaal, fakta: fakta2,
    kilder: kilder2,
    navne: [...new Set([...udgivernavne(fakta2), ...kilder2.map((k) => domaeneLed(k.domaene))])].filter(Boolean),
    soegninger: g.webSearchQueries || [], usage: r.response.usageMetadata || null,
    raa: { fakta: raa.length, uden_kilde: raa.length - fakta.length, uden_adresse: fakta.length - fakta2.length },
  };
  onLog(`Søgning: ${res.soegninger.length} Google-søgninger, ${delspoergsmaal.length} delspørgsmål, ${fakta2.length} af ${raa.length} fakta med kilde, ${res.kilder.length} kilder (${res.kilder.map((k) => k.domaene).join(', ')})`);
  // Også en for tynd søgning gemmes: robotten prøver ellers næste kandidatvideo
  // til samme spørgsmål og ville betale for den samme søgning igen.
  if (delspoergsmaal.length < 3 || fakta2.length < MIN_FAKTA_SOEG || res.kilder.length < MIN_KILDER_SOEG) res.forTynd = true;
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(sti, JSON.stringify(res, null, 1), 'utf8');
  return res;
}

// Til artikel-prompten.
export function soegningTekst(s) {
  return `RESEARCH QUESTIONS (what people searching this need answered):
${s.delspoergsmaal.map((q, i) => `${i + 1}. ${q}`).join('\n')}

RESEARCH FACTS (from the web pages below; the [S#] tag says which page):
${s.fakta.map((f) => `R${f.nr}. ${f.tekst} ${f.kilder.map((n) => `[S${n}]`).join('')}`).join('\n')}

WEB PAGES:
${s.kilder.map((k) => `S${k.nr}. ${k.domaene}${k.titel ? ` — ${k.titel}` : ''}`).join('\n')}`;
}
