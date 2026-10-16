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
import { kerneord } from './headline.mjs';

export const MIN_FAKTA_SOEG = 4;   // så mange fakta med kilde, ellers ingen artikel
export const MIN_KILDER_SOEG = 2;  // så mange forskellige sider bag dem
const CACHE = './.cache/soegning';
const CACHE_VERSION = 4; // hæves, når søgningens regler ændres (3: kildetjek + modargumenter; 4: kildetjek B + emne, 12/10)

// strengt = ekstra runde, når kildetjekket fjernede så meget, at søgningen blev for tynd
// (12/10: i SEO var 11 af 12 kilder bureau-blogs). Så søges der efter primærkilder.
export function soegPrompt(spoergsmaal, dato, strengt = false) {
  return `You are a researcher preparing a reference article that answers the Google search "${spoergsmaal}". Today is ${dato}.
Search Google and study what the top-ranking pages cover for this search.${strengt ? `
Use ONLY primary sources: official documentation (for example Google Search Central or Google Ads Help for search topics), governments and regulators, standards bodies, universities and peer-reviewed research, established news organisations, and companies' own original studies with data they measured themselves. Do NOT use blogs, listicles, agency or marketing sites.` : ''}

Return EXACTLY this format and nothing else:
TOPIC: <the 1-3 word subject people search for, lowercase, for example "data breach">
SUBQUESTIONS:
1. <the search question itself, written as a correct English question>
2. <another question a searcher needs answered to fully understand the answer>
(4 to 6 questions in total, in the order a reader needs them)
FACTS:
- <one fact per line: a full sentence that names its publisher (for example "According to IBM's Cost of a Data Breach Report 2024, ...") and gives numbers, dates and names exactly as the page states them>
(8 to 15 facts that help answer the questions; prefer the most recent figures and primary sources: official sites, research, standards bodies, the company concerned. No forums, no social media, no YouTube.)
If the search assumes something (that X is better than Y, that Z is safe, that W is dead), the facts must TEST that assumption: include evidence that supports it AND evidence that limits or contradicts it.`;
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
  // Emnet i 1-3 ord (12/10): bruges til at hente rigtige Google-søgninger til FAQ'en
  const emne = (s.match(/^\s*\**TOPIC:?\**\s*(.+)$/im)?.[1] || '').replace(/["*]/g, '').toLowerCase().trim().split(/\s+/).slice(0, 3).join(' ');
  return { delspoergsmaal, fakta, emne };
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

// Dommer siderne STÆRK/SVAG for en artikel, der skal kunne stå på mål for sine tal.
// Returnerer et Set af svage kildenumre. Fejler kaldet, fjernes intet (tom mængde) — det
// står i loggen, så det kan ses, at tjekket ikke kørte.
export function kildePrompt(kilder) {
  return `These web pages were found as sources for an evidence-based reference article. Mark each one STRONG or WEAK.
STRONG: governments, regulators, official bodies, standards organisations, universities, peer-reviewed research, established research and consulting firms publishing their own data (for example McKinsey, Gartner, IBM, Verizon reports), a company's own site about its own products or data, established news organisations, Wikipedia. ALSO STRONG: an industry company's own original research with its own data (for example a study by Ahrefs, Semrush or HubSpot of millions of pages it measured itself) and official product documentation (for example Google Search Central, Google Ads Help).
WEAK: statistics roundups and listicles, pages that mainly repeat numbers other sources measured, generic how-to or opinion posts without own data, market-research press-release sites, SEO or affiliate sites, and personal blogs.

${kilder.map((k) => `S${k.nr}. ${k.domaene} — ${k.titel || '(no title)'} — ${k.url}`).join('\n')}

Return JSON only: {"weak":[2,5]}`;
}
async function svageKilder(genAI, hentModel, kilder) {
  if (!kilder.length) return new Set();
  try {
    const r = await hentModel(genAI, { model: GEMINI_MODEL, generationConfig: { maxOutputTokens: 4096, temperature: 0, responseMimeType: 'application/json' } }).generateContent(kildePrompt(kilder));
    const j = JSON.parse((r.response.text() || '').replace(/^```(json)?\s*|\s*```$/g, ''));
    const gyldige = new Set(kilder.map((k) => k.nr));
    return new Set((Array.isArray(j.weak) ? j.weak : []).map(Number).filter((n) => gyldige.has(n)));
  } catch (e) {
    console.log(`Søgning: kildetjekket kunne ikke køre (${String(e.message).split('\n')[0]}) — ingen kilder fjernet`);
    return new Set();
  }
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

  const erTynd = (x) => x.delspoergsmaal.length < 3 || x.fakta.length < MIN_FAKTA_SOEG || x.kilder.length < MIN_KILDER_SOEG;
  let res = await enRunde(genAI, spoergsmaal, hentModel, onLog, false);
  // For tynd FORDI kildetjekket fjernede svage sider? Så én runde mere, der beder om
  // primærkilder. Koster kun i det tilfælde. Begge runders forbrug lægges sammen, så
  // prisen i loggen (SOEG-FORBRUG) er den rigtige.
  if (erTynd(res) && res.svageFjernet > 0) {
    onLog('Søgning: for tynd efter kildetjekket — ny søgning efter primærkilder');
    const res2 = await enRunde(genAI, spoergsmaal, hentModel, onLog, true);
    const sum = (k) => (res.usage?.[k] || 0) + (res2.usage?.[k] || 0);
    const usage = { totalTokenCount: sum('totalTokenCount'), promptTokenCount: sum('promptTokenCount'), candidatesTokenCount: sum('candidatesTokenCount'), thoughtsTokenCount: sum('thoughtsTokenCount') };
    const soegninger = [...res.soegninger, ...res2.soegninger];
    res = { ...(res2.fakta.length > res.fakta.length ? res2 : res), usage, soegninger, runder: 2 };
  }
  if (erTynd(res)) res.forTynd = true;
  // Også en for tynd søgning gemmes: robotten prøver ellers næste kandidatvideo
  // til samme spørgsmål og ville betale for den samme søgning igen.
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(sti, JSON.stringify(res, null, 1), 'utf8');
  return res;
}

// Én søgerunde: Google-søgning gennem Gemini -> fakta med sider bag -> kildetjek.
async function enRunde(genAI, spoergsmaal, hentModel, onLog, strengt) {
  const dato = new Date().toISOString().slice(0, 10);
  const model = hentModel(genAI, { model: GEMINI_MODEL, tools: [{ googleSearch: {} }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192 } });
  const r = await model.generateContent(soegPrompt(spoergsmaal, dato, strengt));
  const kand = r.response.candidates?.[0];
  const tekst = r.response.text() || '';
  const g = kand?.groundingMetadata || {};
  const chunks = g.groundingChunks || [];
  const { delspoergsmaal, fakta: raa, emne } = parseSoegning(tekst);

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
  // Kildekvalitet (12/10): fase C viste svage andenhåndssider ved siden af de stærke
  // (statisticsfundamentals.com, businessresearchinsights.com, en blog der citerede Indiens
  // centralbank). Ét modelkald dømmer siderne; svage sider mister deres adresse og falder
  // dermed ud nedenfor sammen med de fakta, der kun hviler på dem.
  const svage = await svageKilder(genAI, hentModel, kilder.filter((k) => k.url));
  for (const k of kilder) if (svage.has(k.nr)) k.url = null;
  if (svage.size) onLog(`Søgning: ${svage.size} svage kilder fjernet (${kilder.filter((k) => svage.has(k.nr)).map((k) => k.domaene).join(', ')})`);
  // Kilder uden rigtig adresse kan ikke stå i kildelisten — deres fakta må heller ikke bruges.
  // Gyldige kilder nummereres om (1, 2, 3 …), og hvert faktum peger kun på gyldige.
  const nyNr = new Map(kilder.filter((k) => k.url).map((k, i) => [k.nr, i + 1]));
  const kilder2 = kilder.filter((k) => nyNr.has(k.nr)).map((k) => ({ ...k, nr: nyNr.get(k.nr) }));
  const fakta2 = fakta.map((f) => ({ ...f, kilder: f.kilder.filter((n) => nyNr.has(n)).map((n) => nyNr.get(n)) }))
    .filter((f) => f.kilder.length).map((f, i) => ({ ...f, nr: i + 1 }));
  const res = {
    spoergsmaal, emne, hentet: new Date().toISOString(), delspoergsmaal, fakta: fakta2,
    kilder: kilder2,
    navne: [...new Set([...udgivernavne(fakta2), ...kilder2.map((k) => domaeneLed(k.domaene))])].filter(Boolean),
    soegninger: g.webSearchQueries || [], usage: r.response.usageMetadata || null,
    raa: { fakta: raa.length, uden_kilde: raa.length - fakta.length, uden_adresse: fakta.length - fakta2.length },
  };
  onLog(`Søgning${strengt ? ' (primærkilder)' : ''}: ${res.soegninger.length} Google-søgninger, ${delspoergsmaal.length} delspørgsmål, ${fakta2.length} af ${raa.length} fakta med kilde, ${res.kilder.length} kilder (${res.kilder.map((k) => k.domaene).join(', ')})`);
  res.svageFjernet = svage.size;
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

// Dækningstjek (A, 16/10-2026): kan Google-fakta overhovedet besvare hvert delspørgsmål?
// Målt 15/10: 44 % af robottens pris gik til artikler, der blev kasseret bagefter —
// oftest fordi redaktørtjekket fandt et delspørgsmål uden svar (#670 CMMC: "timeline
// and phase-in process" — der var ingen fakta om det, så artiklen kunne ikke svare).
// Tjekket er deterministisk (ingen modelkald): et delspørgsmål er udækket (droppes), når INGEN af dets egne ord findes i noget faktum. (Før: mindst
// halvdelen af egne ord i ét faktum — for strengt.) Egne ord = dem, der ikke står i hovedspørgsmålet.
// Delspørgsmål 1 er selve søgningen og beholdes altid.
const ALMINDELIGE = new Set(['process', 'way', 'ways', 'key', 'main', 'important', 'common', 'different', 'specific', 'typical', 'really', 'actually', 'exactly', 'need', 'needs', 'someone', 'people', 'thing', 'things', 'some', 'most', 'much', 'many', 'there', 'they', 'them', 'their', 'be', 'been', 'has', 'have', 'not', 'any', 'all', 'other', 'these', 'those', 'about', 'between', 'than', 'more', 'less', 'like', 'also', 'make', 'help', 'over', 'out', 'up', 'new', 'one']);
// Ordstamme her = de første 5 bogstaver ("causes"/"cause", "timeline"/"timelines").
// headline.mjs' stamme() gav "cau" for "causes" men "cause" for "cause" (målt 16/10).
const stamme = (w) => String(w).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
export function daekning(delspoergsmaal, fakta, hovedspoergsmaal = '') {
  const hoved = new Set([...kerneord(hovedspoergsmaal), ...kerneord(delspoergsmaal[0] || '')].map(stamme));
  const faktaOrd = fakta.map((f) => new Set(String(f.tekst || f).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(stamme)));
  const behold = [];
  const droppet = [];
  delspoergsmaal.forEach((q, i) => {
    if (i === 0) { behold.push(q); return; }
    const egne = [...new Set(kerneord(q).filter((w) => !ALMINDELIGE.has(w)).map(stamme))].filter((s) => !hoved.has(s));
    // Ingen egne ord = delspørgsmålet gentager emnet; det dækkes af emnets fakta.
    if (!egne.length) { behold.push(q); return; }
    // Krav: mindst ét eget ord i ét faktum. Et strengere krav (halvdelen / 2 ord) droppede
    // 85 hhv. 38 af 128 delspørgsmål i de 25 gemte søgninger (målt 16/10) — også dækkede,
    // fordi fakta bruger andre ord end spørgsmålet. Kun "intet ord overhovedet" er sikkert.
    const krav = 1;
    const bedst = Math.max(0, ...faktaOrd.map((s) => egne.filter((w) => s.has(w)).length));
    if (bedst >= krav) behold.push(q); else droppet.push({ q, egne, bedst, krav });
  });
  return { behold, droppet };
}
