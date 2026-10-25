// Faktatjek og læsbarhed før udgivelse (25/10-2026, Jacobs beslutning efter faktatjekket af
// 20 artikler: 15 bekræftede talfejl i 10 artikler - _udkast/faktatjek/RAPPORT.md).
//
// De gamle tjek (faktaark.mjs ukendteTal, kildetjek.mjs talUdenKilde) så kun, OM et tal stod
// et sted i kilderne. Målingen viste tre huller, som dette modul lukker:
//   1. Kildebinding: "According to IGN, ... two hours" - tallet skal stå hos DEN kilde, der
//      nævnes, ikke bare et sted i researchen (3 falske kildeangivelser i stikprøven).
//   2. Små tal med enhed og skrevne tal: ukendteTal springer tal <= 20 og årstal over, så
//      "4 to 5 pounds", "under ten seconds", "single-nanosecond" og "August 2026" slap igennem.
//   3. En skeptisk faktatjekker (model med Google-søgning) læser hver sætning med et tal, en
//      dato eller en kildeangivelse - det fanger størrelsesordner og videoskaberens egne fejl.
// Plus læsbarhed: Flesch-Kincaid-klassetrin (alle 456 artikler lå på median 15,2; målet er 9-10).
import { saetninger, harKildenavn } from './kildetjek.mjs';
import { domaeneLed } from './soegning.mjs';
import { stavelser } from './readability.mjs';

// ---------- Tal: cifre og skrevne tal, normaliseret til samme form ----------
const ORDTAL = {
  zero: 0, one: 1, single: 1, a: 1, an: 1, two: 2, double: 2, twice: 2, three: 3, triple: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, dozen: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
};
const ENHED = 'nanoseconds?|microseconds?|milliseconds?|ms|ns|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|decades?|pounds?|lbs?|lb|kg|kilograms?|grams?|g\\b|ounces?|oz|inch(?:es)?|feet|foot|meters?|metres?|km|miles?|cm|mm|nm|GB|TB|MB|KB|GHz|MHz|watts?|W\\b|kW|volts?|mAh|fps|Hz|percent|%|x\\b|times|cores?|threads?|pins?|people|users|participants|employees|companies|countries';
// Et "mål": et tal (cifre eller ord) efterfulgt af en enhed. "single-nanosecond" tæller med.
const MAAL = new RegExp(`\\b(\\d[\\d,]*(?:\\.\\d+)?|${Object.keys(ORDTAL).filter((w) => w.length > 2).join('|')})[\\s-]+(?:to\\s+(?:\\d[\\d,]*(?:\\.\\d+)?|\\w+)\\s+)?(${ENHED})\\b`, 'gi');
const MAANED = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:\d{1,2},?\s+)?((?:19|20)\d\d)\b/g;

function tilTal(t) {
  const s = String(t).toLowerCase().replace(/,/g, '');
  if (s in ORDTAL) return String(ORDTAL[s]);
  return s.replace(/\.0+$/, '');
}

// Alle tal i en tekst som normaliserede strenge (cifre + skrevne tal foran en enhed).
export function talMaengde(tekst) {
  const ud = new Set();
  const t = String(tekst);
  for (const m of t.matchAll(/(?<![A-Za-z0-9])\d[\d,]*(?:\.\d+)?/g)) ud.add(tilTal(m[0]));
  for (const m of t.matchAll(MAAL)) ud.add(tilTal(m[1]));
  for (const w of t.toLowerCase().match(/\b[a-z]+\b/g) || []) if (w.length > 2 && w in ORDTAL) ud.add(String(ORDTAL[w]));
  return ud;
}

// Mål (tal + enhed) i en sætning, som de står: ["4 to 5 pounds", "ten seconds"].
export function maalI(s) { return [...String(s).matchAll(MAAL)].map((m) => ({ tekst: m[0], tal: tilTal(m[1]) })); }
// "August 2026" o.l.
export function datoerI(s) { return [...String(s).matchAll(MAANED)].map((m) => ({ tekst: m[0], maaned: m[1].toLowerCase(), aar: m[2] })); }

const udenLinks = (md) => String(md).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const brodtekst = (md) => String(md).split(/\n## Sources\s*\n/)[0];
// Overskrifter er ikke påstande. 25/10: faktatjekkeren fik "## Daniel Gaiya tests iPhone 15 Pro" med
// (tallet 15), svarede med en rettelse inkl. "## ", og overskriften blev til "## ## Daniel ...".
export const saetningerUdenOverskrifter = (md) => saetninger(String(md).split('\n').filter((l) => !/^\s*#/.test(l)).join('\n'));

// ---------- 2. Mål og datoer uden dækning ----------
// Mål med små tal og datoer med måned, som hverken står i researchen eller videoen.
export function maalUdenDaekning(md, kildeTekst) {
  const kendte = talMaengde(kildeTekst);
  const lav = String(kildeTekst).toLowerCase();
  const ud = [];
  for (const s of saetningerUdenOverskrifter(brodtekst(md))) {
    const mangler = [];
    for (const m of maalI(s)) if (!kendte.has(m.tal)) mangler.push(m.tekst);
    for (const d of datoerI(s)) if (!(lav.includes(d.maaned) && lav.includes(d.aar))) mangler.push(d.tekst);
    if (mangler.length) ud.push({ saetning: s, mangler });
  }
  return ud;
}

// ---------- 1. Kildebinding ----------
// For hver sætning, der nævner en kilde ved navn: står sætningens tal hos DEN kilde?
// navne = soeg.navne. En kilde, vi ikke kan finde fakta for, dømmes ikke (ingen falske fund).
export function kildeBinding(md, soeg, { kanal = '', videoTekst = '' } = {}) {
  const fakta = soeg?.fakta || [];
  const kilder = soeg?.kilder || [];
  const navne = [...new Set([...(soeg?.navne || []), kanal].filter((n) => n && n.length >= 2))];
  const tekstFor = (navn) => {
    const n = navn.toLowerCase();
    if (kanal && n === kanal.toLowerCase()) return videoTekst;
    const sider = new Set(kilder.filter((k) => domaeneLed(k.domaene) === n || String(k.domaene).toLowerCase().includes(n)).map((k) => k.nr));
    return fakta.filter((f) => f.tekst.toLowerCase().includes(n) || f.kilder.some((nr) => sider.has(nr))).map((f) => f.tekst).join('\n');
  };
  const ud = [];
  for (const s of saetningerUdenOverskrifter(brodtekst(md))) {
    const nævnte = navne.filter((n) => harKildenavn(s, [n]));
    if (!nævnte.length) continue;
    const tekst = nævnte.map(tekstFor).join('\n');
    if (!tekst.trim()) continue;
    const kendte = talMaengde(tekst);
    // Tal i sætningen, der skal stå hos kilden: alle cifre (også små og årstal) og alle mål.
    const tal = new Set([...[...s.matchAll(/(?<![A-Za-z0-9.])\d[\d,]*(?:\.\d+)?/g)].map((m) => tilTal(m[0])), ...maalI(s).map((m) => m.tal)]);
    // Versionsnumre o.l. i navne ("GPT-4", "Kling 3", "DDR5") er ikke påstande.
    for (const m of s.matchAll(/[A-Za-z]+[- ]?(\d+(?:\.\d+)?)\b(?!\s*(?:%|percent|million|billion))/g)) if (/[A-Z]/.test(m[0][0])) tal.delete(tilTal(m[1]));
    const mangler = [...tal].filter((t) => !kendte.has(t));
    if (mangler.length) ud.push({ saetning: s, navne: nævnte, mangler });
  }
  return ud;
}

// ---------- 3. Skeptisk faktatjekker (model med Google-søgning) ----------
const KILDEORD = /\b(according to|said|says|reports?|study|survey|published|journal|et al\.|research(?:ers)?|data from|estimates?|forecasts?)\b/i;
export function tjekSaetninger(md) {
  return saetningerUdenOverskrifter(brodtekst(md)).filter((s) => s.split(/\s+/).length >= 4 && (/\d/.test(s) || maalI(s).length || datoerI(s).length || KILDEORD.test(s)));
}

export function skeptikerPrompt(ss, researchTekst, videoNoter) {
  return `You are the fact-checker at a newspaper. Check every numbered sentence from an article before it is published. Use the RESEARCH and VIDEO NOTES below, and Google Search when they do not settle it.

For each sentence decide:
- OK: the numbers, dates, durations, units, names and the attribution ("According to X", "a study by Y", "published in Z") are correct.
- WRONG: it contradicts a reliable source, gets an order of magnitude or a unit wrong, invents or shifts a date, mixes up two figures, attributes a claim to a publisher, study, author or journal that did not say it, or repeats a video creator's claim that is factually wrong.
- UNSUPPORTED: it states a specific figure or attribution you cannot find any support for.
Check written-out numbers too ("ten seconds", "a minute", "single-nanosecond", "two hours").

For WRONG and UNSUPPORTED give "fix": the same sentence corrected - use the verified figure and name its real source, or make the same point without the figure. Plain English, same style. If nothing can be saved, "fix" is "".

Return ONLY a JSON array, one object per sentence, e.g.
[{"n":1,"verdict":"OK"},{"n":2,"verdict":"WRONG","why":"RAM latency is about 14 ns, not single nanoseconds","fix":"..."}]

SENTENCES:
${ss.map((s, i) => `${i + 1}. ${s}`).join('\n')}

RESEARCH (facts found on the web, with their pages):
${researchTekst}

VIDEO NOTES (what the video creator said):
${videoNoter}`;
}

export function parseSkeptiker(tekst, ss) {
  const m = String(tekst).match(/\[[\s\S]*\]/);
  if (!m) return null;
  let arr;
  try { arr = JSON.parse(m[0]); } catch { return null; }
  if (!Array.isArray(arr)) return null;
  return arr.filter((x) => x && Number.isInteger(x.n) && ss[x.n - 1]).map((x) => ({
    saetning: ss[x.n - 1], dom: String(x.verdict || '').toUpperCase(), grund: String(x.why || ''), rettet: String(x.fix || '').trim(),
  }));
}

// Kører faktatjekkeren i bidder af 25 sætninger. Returnerer null, hvis kaldet fejler.
export async function skeptiker(genAI, hentModel, model, md, researchTekst, videoNoter) {
  const ss = tjekSaetninger(md);
  const ud = [];
  let usage = { ind: 0, ud: 0 };
  for (let i = 0; i < ss.length; i += 25) {
    const del = ss.slice(i, i + 25);
    try {
      const r = await hentModel(genAI, { model, tools: [{ googleSearch: {} }], generationConfig: { temperature: 0, maxOutputTokens: 16384 } })
        .generateContent(skeptikerPrompt(del, researchTekst, videoNoter));
      const fund = parseSkeptiker(r.response.text() || '', del);
      if (!fund) return null;
      ud.push(...fund);
      const u = r.response.usageMetadata || {};
      usage = { ind: usage.ind + (u.promptTokenCount || 0), ud: usage.ud + (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) };
    } catch { return null; }
  }
  return { tjekket: ss.length, fund: ud.filter((x) => x.dom === 'WRONG' || x.dom === 'UNSUPPORTED'), usage };
}

// Sætter rettede sætninger ind i stedet for de forkerte. En sætning uden brugbar rettelse
// fjernes. Returnerer også dem, der ikke kunne findes i teksten (så tæller de som uløste).
export function anvendRettelser(md, fund) {
  let ny = md;
  const ikkeFundet = [];
  for (const f of fund) {
    // Sætningen er hentet uden links og fed skrift. Den findes i markdown ved at matche dens
    // ord i rækkefølge, med alt andet imellem tilladt (mellemrum, **, [, ](url), komma).
    const ord = String(f.saetning).match(/[A-Za-z0-9$%]+/g) || [];
    if (!ord.length) { ikkeFundet.push(f); continue; }
    const re = new RegExp(ord.map((w) => w.replace(/\$/g, '\\$')).join('(?:\\]\\([^)]*\\)|[^A-Za-z0-9$%\\n])+?') + '(?:\\]\\([^)]*\\))?[^\\sA-Za-z0-9]*');
    const m = ny.match(re);
    if (!m) { ikkeFundet.push(f); continue; }
    ny = ny.slice(0, m.index) + String(f.rettet || '').replace(/^#+\s*/, '') + ny.slice(m.index + m[0].length);
    ny = ny.replace(/[ \t]{2,}/g, ' ');
  }
  // Tomme punkter i lister efter en fjernet sætning
  ny = ny.replace(/^\s*[-*]\s*$/gm, '').replace(/\n{3,}/g, '\n\n');
  return { md: ny, ikkeFundet };
}

// ---------- Læsbarhed: Flesch-Kincaid-klassetrin på brødteksten ----------
export const KLASSETRIN_MAAL = 9;     // det prompten beder om (9.-10. klasse, Jacob 25/10)
export const KLASSETRIN_MAKS = 10.5;  // over dette: én forenkling
// Prøverne 25/10 (pc-bygning, kryptovolatilitet, Google TPU): sætningerne kom ned på 12,8-13,7 ord,
// men klassetrinnet stod på 12,0 / 14,4 / 14,2 efter forenkling. Flesch-Kincaid tæller stavelser,
// og emnets egne ord ("cryptocurrency", "volatility", "inference") kan ikke skiftes ud - folk søger
// på dem. Klassetrinnet er derfor kun nødbremse; selve kravet er korte sætninger + forklarede fagord
// (læsertjekkets JARGON-fund, src/lib/laesertjek.mjs).
export const KLASSETRIN_STOP = 16;
export const ORD_MAAL = 16;           // gennemsnitlige ord pr. sætning: over dette forenkles
export const ORD_STOP = 18;           // stadig over dette efter forenkling: ingen artikel
export function klassetrin(md) {
  const tekst = udenLinks(brodtekst(md)).split('\n')
    .filter((l) => l.trim() && !/^\s*#/.test(l) && !/^\s*\|/.test(l))
    .map((l) => l.replace(/^\s*([-*]|\d+\.)\s+/, '').replace(/[*_`>]/g, '').trim())
    .map((l) => (/[.!?:]["”']?$/.test(l) ? l : l + '.'))
    .join(' ');
  const ss = tekst.split(/(?<=[.!?:])\s+/).filter((s) => s.split(/\s+/).length >= 3);
  const ord = tekst.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (!ss.length || !ord.length) return { klassetrin: 0, ordPrSaetning: 0 };
  const stav = ord.reduce((n, w) => n + stavelser(w), 0);
  return {
    klassetrin: Math.round((0.39 * (ord.length / ss.length) + 11.8 * (stav / ord.length) - 15.59) * 10) / 10,
    ordPrSaetning: Math.round(ord.length / ss.length * 10) / 10,
  };
}

// 25/10: jegStemme = artiklen har ejerens jeg-afsnit (Jacobs hjerne). Før stod der altid "No first
// person" her, og forenklingen fjernede Jacobs afsnit igen (målt: 2 artikler med hjernen, 0 jeg-afsnit).
export function forenklPrompt(md, maal = KLASSETRIN_MAAL, jegStemme = false) {
  return `Rewrite the article below so a curious 15-year-old can read it easily (Flesch-Kincaid grade ${maal}). It is for a general audience, written like a good newspaper explainer.

Rules:
- Split long sentences. Aim for 12-16 words per sentence on average; no sentence over 25 words.
- Prefer common words. The first time a technical term appears, explain it in a few plain words (for example "latency (the delay before data arrives)"). Keep the term itself - readers search for it.
- Keep EVERY number, date, name, quotation and source attribution exactly as written ("According to X" stays with the same figure).
- Keep every "## " heading word for word, every markdown link, every list and table, and the order of the sections.
- Do not add facts, opinions or examples. Do not remove facts.
${jegStemme ? '- Keep the ONE first-person passage (the site owner\'s own view) - simplify its sentences, but keep it in the first person and keep its meaning. No other first person, no hype words.' : '- No first person, no hype words.'}
Output ONLY the rewritten article in markdown.

ARTICLE:
${md}`;
}
