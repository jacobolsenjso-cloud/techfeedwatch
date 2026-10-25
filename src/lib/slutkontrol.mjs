// Slutkontrol (25/10-2026, Jacobs beslutning: "én opskrift, én slutkontrol, det skal bare virke").
//
// Før lå faktatjekket midt i robotten og dækkede kun brødteksten - FAQ'en slap igennem med en falsk
// NIST-henvisning. Nu kører ÉN kontrol til sidst, på den færdige artikel, og den dækker ALT, læseren
// ser. Listen over felter står her ét sted (LAESER_FELTER), så intet kan glemmes:
//   titel, meta, resumé, FAQ-svar, brødtekst og faktaboks.
//
// Tre lag:
//   1. Kildebinding og mål (deterministisk, src/lib/faktatjek.mjs): et tal skal stå hos den kilde, det
//      tilskrives; mål og datoer skal stå i researchen eller videoen. (Kun med research.)
//   2. Belæg: hver sætning, der tilskriver et tal til en navngiven kilde, skal have en webside fra den
//      kilde med et ordret citat. KODEN henter siden og kontrollerer, at citatet og tallene står der.
//      Det er ikke en models vurdering - det er et opslag. Opfundne "According to X" falder her.
//   3. Skeptisk faktatjekker med Google-søgning over alle felter (størrelsesordner, enheder, datoer,
//      videoskaberens egne fejl).
// Det, der fanges, rettes eller fjernes. Rettelser tjekkes én gang til. Står der stadig noget,
// kaster kontrollen en fejl, og artiklen udgives ikke.
import { kildeBinding, maalUdenDaekning, skeptiker, anvendRettelser, talMaengde, maalI, saetningerUdenOverskrifter } from './faktatjek.mjs';

export const LAESER_FELTER = ['titel', 'meta', 'resume', 'faq', 'brodtekst', 'faktaboks'];

const brod = (md) => String(md || '').split(/\n## Sources\s*\n/)[0];
const kilder = (md) => { const i = String(md || '').search(/\n## Sources\s*\n/); return i < 0 ? '' : md.slice(i); };

// Tekster pr. felt, som kontrollen ser dem. Faktaboksen er data fra researchen, men vises - den tjekkes.
function feltTekster(f) {
  return [
    { felt: 'titel', tekst: f.titel || '' },
    { felt: 'meta', tekst: f.meta || '' },
    { felt: 'resume', tekst: f.resume || '' },
    ...(f.faqs || []).map((q, i) => ({ felt: `faq${i}`, tekst: q.answer || '' })),
    ...(f.faktaboks || []).map((k, i) => ({ felt: `fakta${i}`, tekst: k.text || '' })),
  ].filter((x) => x.tekst.trim());
}

// Sætter en rettelse ind i det felt, hvor sætningen står (brødtekst eller et kort felt).
function anvend(f, fund) {
  let ikkeFundet = 0;
  for (const x of fund) {
    const r = anvendRettelser(f.brodtekst, [x]);
    if (!r.ikkeFundet.length) { f.brodtekst = r.md; continue; }
    let sat = false;
    for (const k of ['titel', 'meta', 'resume']) {
      if (!f[k]) continue;
      const rr = anvendRettelser(f[k], [x]);
      if (!rr.ikkeFundet.length) { f[k] = rr.md.trim(); sat = true; break; }
    }
    if (!sat) for (const q of f.faqs || []) { const rr = anvendRettelser(q.answer, [x]); if (!rr.ikkeFundet.length) { q.answer = rr.md.trim(); sat = true; break; } }
    if (!sat) for (const k of f.faktaboks || []) { const rr = anvendRettelser(k.text, [x]); if (!rr.ikkeFundet.length) { k.text = rr.md.trim(); sat = true; break; } }
    if (!sat) ikkeFundet++;
  }
  // Tomme FAQ-svar og faktabokspunkter fjernes; en tom titel/meta må aldrig opstå.
  f.faqs = (f.faqs || []).filter((q) => q.answer.split(/\s+/).length >= 5);
  f.faktaboks = (f.faktaboks || []).filter((k) => k.text.split(/\s+/).length >= 5);
  return ikkeFundet;
}

// ---------- 2. Belæg: URL + ordret citat, kontrolleret af koden ----------
const KILDEUDSAGN = /\b(according to|reports?|reported|says|said|found|finds|estimates?|estimated|forecasts?|forecast|study|survey|published|data from|figures from|lists|states|notes)\b/i;
// alleTal = true (stikproeve.mjs): ALLE sætninger med tal eller mål, ikke kun dem, der nævner en kilde.
export function belaegSaetninger(f, navne = [], kanal = '', alleTal = false) {
  const alle = [...saetningerUdenOverskrifter(brod(f.brodtekst)), ...feltTekster(f).flatMap((x) => saetningerUdenOverskrifter(x.tekst))];
  const kanalRe = kanal ? new RegExp(`\\b${kanal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i') : null;
  // Et tal i et produktnavn ("TPU 8t", "iPhone 17", "Gemini 3") eller et årstal er ikke en påstand
  // (målt 25/10: stikprøven markerede den rigtige "TPU 8t" som ikke fundet).
  return [...new Set(alle)].filter((s) => paastandsTal(s).some((t) => !/^(19|20)\d\d$/.test(t)) || maalI(s).length)
    .filter((s) => alleTal || KILDEUDSAGN.test(s) || navne.some((n) => n.length > 2 && s.includes(n)))
    .filter((s) => !(kanalRe && kanalRe.test(s))); // videoens tal tjekkes mod transskriptet i lag 1
}

function belaegPrompt(ss) {
  return `For each numbered sentence below, find the web page of the source the sentence names (or, if it names none, the original source of the figure) that states the figure. Use Google Search.
Return ONLY a JSON array, one object per sentence: [{"n":1,"url":"https://...","quote":"..."}]
- "url": the page that states the figure, from the named publisher's own site when possible.
- "quote": one sentence copied WORD FOR WORD from that page that contains the figure. Do not paraphrase.
- If you cannot find such a page, use "url":"" and "quote":"".

SENTENCES:
${ss.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

// HTML-tegnkoder ("&ordm;", "&#8217;", "&rsquo;") skal laves om til tegn, før citatet kan findes
// (målt 25/10: Apples side skriver "0&ordm; and 35&ordm; C"). Alle bindestreger (også U+2011, som
// figure.ai bruger i "hand‑engineered") gøres ens - ellers afvises et rigtigt citat.
const ENT = { nbsp: ' ', amp: '&', ordm: '°', deg: '°', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: '-', mdash: '-', quot: '"', apos: "'", lt: '<', gt: '>', hellip: '...', times: 'x', euro: '€', pound: '£', reg: '', trade: '', copy: '' };
const afkod = (t) => String(t).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENT ? ENT[n.toLowerCase()] : m));
const norm = (t) => afkod(t).toLowerCase().replace(/[º˚]/g, '°').replace(/\u00a0/g, ' ').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, ' ').trim();
async function hentSide(url, timeoutMs = 12000) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechFeedWatch-factcheck/1.0; +https://techfeedwatch.com/editorial-guidelines/)', Accept: 'text/html,application/xhtml+xml' } });
    if (!r.ok) return null;
    // En PDF (fx FBI's IC3-rapport) kan ikke læses som tekst her: usikker, ikke "står der ikke"
    // (målt 25/10: det rigtige tal 880,418 fra IC3-PDF'en blev ellers afvist).
    const type = r.headers.get('content-type') || '';
    if (/pdf|octet-stream/i.test(type) || /\.pdf(\?|$)/i.test(url)) return null;
    const html = await r.text();
    return norm(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
  } catch { return null; }
}
// Tallene i sætningen, der skal stå på siden (versionsnumre i navne undtaget, som i kildeBinding).
function paastandsTal(s) {
  const t = new Set([...String(s).matchAll(/(?<![A-Za-z0-9.])\d[\d,]*(?:\.\d+)?(?![A-Za-wyz])/g)].map((m) => m[0].replace(/,/g, '').replace(/\.0+$/, '')));
  // Navne og dokument-numre: "iPhone 17", "TPU 8", "Publication 800-12 Rev. 1" (målt 25/10: NIST-
  // definitionen blev fjernet, fordi "800-12" og "1" blev læst som tal, ingen side kunne citere).
  for (const m of String(s).matchAll(/[A-Za-z]+\.?[- ]?(\d+(?:\.\d+)?)(?:-(\d+))?\b(?!\s*(?:%|percent|million|billion))/g)) if (/[A-Z]/.test(m[0])) { t.delete(m[1]); if (m[2]) t.delete(m[2]); }
  return [...t];
}

// Henter siden og kontrollerer, at citatet og sætningens tal står der. null = siden kunne ikke hentes.
export async function kontrollerBelaeg(s, url, quote) {
  const side = await hentSide(url);
  // Tom eller næsten tom side (målt 25/10: IEEE svarer 202 uden indhold til robotter) kan ikke læses.
  if (side === null || side.length < 1500) return null;
  const q = norm(quote);
  const tal = paastandsTal(s);
  const findes = (t) => side.includes(t) || side.includes(Number(t).toLocaleString('en-US'));
  const citatFindes = side.includes(q.slice(0, 120));
  const mangler = tal.filter((t) => !findes(t));
  if (!citatFindes) {
    // Står citatets ord slet ikke på siden, er det ikke artiklens tekst, koden har fået - siden
    // bygges med JavaScript eller er en cookie-mur (målt 25/10: Googles blog og IFR). Usikker.
    const ord = [...new Set(q.split(/[^a-z0-9]+/).filter((w) => w.length >= 5))];
    if (ord.length >= 3 && ord.filter((w) => side.includes(w)).length / ord.length < 0.5) return null;
    // Citatet står der ikke ordret, men ALLE sætningens tal og mål står på siden: usikker (null) -
    // skeptikeren afgør. Målt 25/10: rigtige tal fra Google og Figure blev ellers afvist, fordi
    // modellen gengav citatet en anelse forkert.
    const maal = maalI(s).map((m) => norm(m.tekst));
    if (tal.length + maal.length > 0 && !mangler.length && maal.every((m) => side.includes(m))) return null;
    return { ok: false, grund: `the quoted text is not on ${url}` };
  }
  if (mangler.length) return { ok: false, grund: `${url} does not give ${mangler.join(', ')}` };
  return { ok: true };
}

// Sætninger uden belæg og uden skeptikerens rettelse: ét forsøg på at rette dem efter en rigtig
// kilde (med Google-søgning), før de fjernes. Rettelsen tjekkes bagefter med alle lag som de andre.
// Målt 25/10: to rigtige sætninger (Figure, 1X) blev ellers fjernet, og afsnittet hang ikke sammen.
export async function retEfterKilde(genAI, hentModel, model, ss) {
  if (!ss.length) return [];
  const p = `Each numbered sentence below is from a published article, but its figure or claim could not be verified on a real web page. Use Google Search to find the original source.
Rewrite each sentence so that every figure matches that source EXACTLY as the source states it, and name the source in the sentence (for example "according to Figure"). Keep the meaning, plain style and length; one sentence each. If no real source supports the claim, use "REMOVE".
Return ONLY a JSON array: [{"n":1,"rettet":"..."}]

SENTENCES:
${ss.map((x, i) => `${i + 1}. ${x}`).join('\n')}`;
  try {
    const r = await hentModel(genAI, { model, tools: [{ googleSearch: {} }], generationConfig: { temperature: 0, maxOutputTokens: 8192 } }).generateContent(p);
    const arr = JSON.parse(((r.response.text() || '').match(/\[[\s\S]*\]/) || ['[]'])[0]);
    return ss.map((_, i) => { const t = String((Array.isArray(arr) ? arr : []).find((y) => y && y.n === i + 1)?.rettet || '').trim(); return /^remove$/i.test(t) ? '' : t.replace(/^#+\s*/, ''); });
  } catch { return ss.map(() => ''); }
}

// Højst BELAEG_PR_KALD sætninger pr. kald, med LAV tænkning. Målt 25/10 på pc-artiklen: fuld og
// medium tænkning tog 200 - over 300 sek. pr. kald, og Node afbryder et svar efter 300 sek.
// ("fetch failed"). Lav: 13-84 sek. pr. artikel. Lav finder færre sider - derfor er "ingen side
// fundet" kun usikker (skeptikeren afgør); kun "siden fundet, men citat/tal står der ikke" er fejl.
const BELAEG_PR_KALD = 3;
async function belaegKald(genAI, hentModel, model, ss) {
  for (let forsoeg = 0; forsoeg < 2; forsoeg++) {
    try {
      const r = await hentModel(genAI, { model, tools: [{ googleSearch: {} }], generationConfig: { temperature: 0, maxOutputTokens: 16384, thinkingConfig: { thinkingLevel: process.env.BELAEG_TAENK || 'low' } } }).generateContent(belaegPrompt(ss));
      const tekst = r.response.text() || '';
      const arr = JSON.parse((tekst.match(/\[[\s\S]*\]/) || ['[]'])[0]);
      if (Array.isArray(arr)) return arr;
    } catch (e) { console.log(`   ⚠️ belæg-kald fejlede (forsøg ${forsoeg + 1}): ${String(e.message).split('\n')[0].slice(0, 200)}`); }
  }
  return null;
}

export async function belaeg(genAI, hentModel, model, ss) {
  if (!ss.length) return { tjekket: 0, ikkeBelagt: [], uden: 0, usikre: 0 };
  const svar = [];
  for (let i = 0; i < ss.length; i += BELAEG_PR_KALD) {
    const del = await belaegKald(genAI, hentModel, model, ss.slice(i, i + BELAEG_PR_KALD));
    if (del === null) return null;
    svar.push(...del.map((x) => ({ ...x, n: x && Number(x.n) + i })));
  }
  const ikkeBelagt = [], ikkeFundet = [];
  let usikre = 0;
  for (let i = 0; i < ss.length; i++) {
    const s = ss[i];
    const b = svar.find((x) => x && x.n === i + 1) || {};
    const url = String(b.url || ''), quote = norm(b.quote || '');
    if (/youtube\.com|youtu\.be/i.test(url)) { usikre++; continue; } // en video kan koden ikke læse
    if (!url || quote.split(' ').length < 5) { ikkeFundet.push(s); usikre++; continue; } // ingen side: usikker
    const k = await kontrollerBelaeg(s, url, quote);
    if (k === null) { usikre++; continue; } // siden kunne ikke hentes: skeptikeren (lag 3) afgør
    if (!k.ok) ikkeBelagt.push({ saetning: s, grund: k.grund });
  }
  return { tjekket: ss.length, ikkeBelagt, ikkeFundet, usikre };
}

// ---------- Selve slutkontrollen ----------
// f = { titel, meta, resume, faqs:[{question,answer}], brodtekst, faktaboks:[{text,source,url}] } (ændres på stedet)
// k = { soeg, kanal, videoTekst, research, videoNoter }
export async function slutkontrol(genAI, hentModel, model, f, k, log = console.log) {
  const rap = { kildeOgMaal: 0, belaegTjekket: 0, ikkeBelagt: 0, belaegUsikre: 0, skeptikerTjekket: 0, fanget: 0, rettet: 0, fjernet: 0 };
  const helTekst = () => [brod(f.brodtekst), ...feltTekster(f).map((x) => x.tekst)].join('\n\n');

  // 1. Kildebinding og mål (kun når robotten har researchen)
  const detFund = () => {
    if (!k.soeg) return [];
    const m = new Map();
    for (const b of kildeBinding(helTekst(), k.soeg, { kanal: k.kanal, videoTekst: k.videoTekst })) m.set(b.saetning, `${b.navne.join('/')} gives no ${b.mangler.join(', ')} in the research`);
    for (const x of maalUdenDaekning(helTekst(), `${k.videoTekst}\n${(k.soeg.fakta || []).map((y) => y.tekst).join('\n')}`)) m.set(x.saetning, `${x.mangler.join(', ')} is in neither the research nor the video`);
    return [...m].map(([saetning, grund]) => ({ saetning, grund, dom: 'WRONG', rettet: '' }));
  };

  // 2. Belæg
  const bs = belaegSaetninger(f, k.soeg?.navne || [], k.kanal);
  const bl = await belaeg(genAI, hentModel, model, bs);
  if (bl === null) throw new Error('Slutkontrol: belæg-tjekket kunne ikke køre (midlertidig fejl hos Gemini). Artiklen skrives ikke.');
  rap.belaegTjekket = bl.tjekket; rap.ikkeBelagt = bl.ikkeBelagt.length; rap.belaegUsikre = bl.usikre;

  // 3. Skeptiker over alle felter
  const sk = await skeptiker(genAI, hentModel, model, helTekst(), k.research, k.videoNoter);
  if (sk === null) throw new Error('Slutkontrol: faktatjekket kunne ikke køre (midlertidig fejl hos Gemini). Artiklen skrives ikke.');
  rap.skeptikerTjekket = sk.tjekket;

  // Saml fund pr. sætning. Skeptikerens rettelse bruges, hvis den har én; ellers fjernes sætningen.
  const fund = new Map();
  for (const x of detFund()) fund.set(x.saetning, x);
  for (const x of bl.ikkeBelagt) fund.set(x.saetning, { ...x, dom: 'WRONG', rettet: '' });
  for (const x of sk.fund) fund.set(x.saetning, { ...(fund.get(x.saetning) || {}), ...x });
  rap.kildeOgMaal = detFund().length; rap.fanget = fund.size;
  if (!fund.size) return rap;
  for (const x of fund.values()) log(`   - [${x.dom}] ${x.saetning.slice(0, 120)} (${String(x.grund).slice(0, 110)})`);
  const udenRet = [...fund.values()].filter((x) => !x.rettet);
  const nye = await retEfterKilde(genAI, hentModel, model, udenRet.map((x) => x.saetning));
  udenRet.forEach((x, i) => { if (nye[i] && nye[i] !== x.saetning) x.rettet = nye[i]; });
  if (udenRet.length) log(`   ↻ rettet efter kilde: ${nye.filter(Boolean).length} af ${udenRet.length}${nye.filter(Boolean).map((t) => `\n     + ${t.slice(0, 160)}`).join('')}`);

  const ikkeFundet = anvend(f, [...fund.values()]);
  if (ikkeFundet) throw new Error(`Slutkontrol: ${ikkeFundet} fanget sætning(er) kunne ikke findes i artiklen. Artiklen skrives ikke.`);
  // Rettelserne tjekkes én gang til - med alle tre lag. Holder en ikke, fjernes den.
  const rettede = [...fund.values()].filter((x) => x.rettet).map((x) => x.rettet);
  rap.fjernet = fund.size - rettede.length;
  if (rettede.length) {
    const igenSk = await skeptiker(genAI, hentModel, model, rettede.join('\n\n'), k.research, k.videoNoter);
    const igenBl = await belaeg(genAI, hentModel, model, rettede.filter((s) => belaegSaetninger({ brodtekst: s }, k.soeg?.navne || [], k.kanal).length));
    const daarlige = new Set([...(igenSk?.fund || []).map((x) => x.saetning), ...(igenBl?.ikkeBelagt || []).map((x) => x.saetning)]);
    if (igenSk === null || igenBl === null) throw new Error('Slutkontrol: genkontrollen kunne ikke køre (midlertidig fejl hos Gemini). Artiklen skrives ikke.');
    // Genkontrollens sætninger kan være delt anderledes; fjern dem, der indeholder et fund.
    const fjern = rettede.filter((r) => [...daarlige].some((d) => r.includes(d) || d.includes(r)));
    if (fjern.length) { anvend(f, fjern.map((s) => ({ saetning: s, rettet: '' }))); log(`   ✗ ${fjern.length} rettelse(r) holdt ikke genkontrollen og er fjernet`); }
    rap.rettet = rettede.length - fjern.length; rap.fjernet += fjern.length;
  }
  // Lag 1 igen. En rettelse, der har bestået genkontrollen (belæg + skeptiker), er godkendt, selvom
  // dens tal kommer fra en webside uden for researchen (målt 25/10: kvantecomputer-artiklen blev ellers
  // stoppet af sin egen rettelse). Andre sætninger uden dækning fjernes - artiklen skal ikke stoppes.
  const godkendte = new Set([...fund.values()].map((x) => x.rettet).filter(Boolean).filter((r) => helTekst().includes(r)));
  const erGodkendt = (s) => [...godkendte].some((g) => g.includes(s) || s.includes(g));
  let tilbage = detFund().filter((x) => !erGodkendt(x.saetning));
  if (tilbage.length) {
    for (const x of tilbage) log(`   ✗ fjernet (tal uden dækning): ${x.saetning.slice(0, 140)}`);
    anvend(f, tilbage.map((x) => ({ saetning: x.saetning, rettet: '' })));
    rap.fjernet += tilbage.length;
    tilbage = detFund().filter((x) => !erGodkendt(x.saetning));
  }
  if (tilbage.length) throw new Error(`Slutkontrol: ${tilbage.length} sætning(er) med tal uden dækning kunne ikke fjernes. Artiklen skrives ikke.`);
  if (!f.titel || !String(f.meta || 'x').trim()) throw new Error('Slutkontrol: titel eller meta blev tom. Artiklen skrives ikke.');
  return rap;
}

export { brod, kilder };
