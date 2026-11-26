// Kontrollanten (20/11-2026, Jacob: "en ny konsulent, der dobbelttjekker" - fejlene skal fanges, før han læser).
//
// Hvorfor en til: slutkontrollen (slutkontrol.mjs) fangede ikke fejlene i entanglement-artiklen 20/11:
//   - belægstjekket ser kun sætninger MED TAL - "NIST says ... evaluates 2^n" og "MIT highlights
//     Gottesman-Knill" blev aldrig holdt op mod kilden; et link i teksten blev aldrig tjekket; PDF'er sprang den over.
//   - skeptikeren læser én sætning ad gangen (ingen selvmodsigelser) med samme model, som skrev teksten.
// Tre lag, på den FÆRDIGE artikel (alle felter læseren ser), lige før kladden gemmes:
//   A. Kildetekst: hver sætning, der nævner en af artiklens kilder (navn eller link), holdes op mod KILDENS EGEN
//      TEKST (koden henter siden; PDF sendes som fil). Siger kilden det ikke, prøves de andre kilder; ellers rettes
//      sætningen til det, kilderne siger, eller den fjernes. Citater kontrolleres af koden, ikke af modellen.
//   B. Ekspertlæsning: hele artiklen på én gang, med Google-søgning og høj tænkning: kendte misforståelser,
//      selvmodsigelser, overdrivelser, uintroducerede navne og "researchers say" uden navn. Rettelser læses igen.
//   C. Faste regler i koden: navnløse autoriteter, meta-længde, antal jeg-afsnit (kun til rapporten).
// Rapporten gemmes i kladden og vises på /godkend, så Jacob kan se, hvad der er tjekket og rettet.
import { hentModel, GEMINI_MODEL, forbrug } from './model.mjs';
import { anvend } from './slutkontrol.mjs';
import { reparer } from './sammenhaeng.mjs';

export const KONTROL_MODEL = process.env.KONTROL_MODEL || GEMINI_MODEL;
const KILDE_TEGN = 60000; // højst så meget af en kildes tekst pr. kald (ca. 15.000 tokens)

// ---------- tekst ----------
const norm = (t) => String(t || '').toLowerCase()
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&(nbsp|amp|rsquo|lsquo|rdquo|ldquo|ndash|mdash|quot|apos);/g, ' ')
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―−]/g, '-').replace(/[^a-z0-9%$.,'"\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
const udenMd = (t) => String(t || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|__|`/g, '').trim();
const brod = (md) => String(md || '').split(/\n## Sources\s*\n/)[0];

// Sætninger med deres markdown (så links kan læses). Overskrifter, tabeller og "Try the numbers"-linjer springes over.
export function saetningerMedLinks(md) {
  const ud = [];
  for (const blok of brod(md).split(/\n\s*\n/)) {
    for (let linje of blok.split('\n')) {
      linje = linje.trim();
      if (!linje || /^#|^\||^>/.test(linje)) continue;
      linje = linje.replace(/^[-*]\s+|^\d+\.\s+/, '');
      for (const s of linje.split(/(?<=[.!?])\s+(?=[A-Z"(\[])/)) {
        const ren = udenMd(s);
        if (ren.split(/\s+/).length >= 5) ud.push({ md: s, tekst: ren, links: [...s.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]) });
      }
    }
  }
  return ud;
}

// Artiklens kildeliste: "- [titel](url) — domæne"
export function kildeliste(md) {
  const i = String(md || '').search(/\n## Sources\s*\n/);
  if (i < 0) return [];
  return [...md.slice(i).matchAll(/^- \[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gm)]
    .map((m) => ({ titel: m[1], url: m[2], vaert: new URL(m[2]).hostname.replace(/^www\./, '') }))
    .filter((k) => !/(^|\.)(youtube\.com|youtu\.be)$/.test(k.vaert));
}
// Navnet på en kilde, som det står i teksten: "nist.gov" -> NIST, "news.mit.edu" -> MIT, "caltech.edu" -> Caltech
const KENDTE = { mit: ['MIT', 'Massachusetts Institute of Technology'], nist: ['NIST', 'National Institute of Standards'], caltech: ['Caltech', 'California Institute of Technology'] };
export function kildeNavneRe(vaert) {
  const led = vaert.split('.');
  const navn = led.length >= 2 ? led[led.length - 2] : led[0];
  const ord = [...new Set([...(KENDTE[navn] || []), navn])].filter((x) => x.length >= 2);
  // Korte navne (IBM, MIT, NIST) kun med store bogstaver - ellers matcher "mit" i "submit". Lange: uden hensyn til store/små.
  // 20/11 (målt): navnet alene er ikke nok - i en artikel OM PlayStation nævnte 21 af 26 sætninger "PlayStation" og blev
  // alle holdt op mod blog.playstation.com. Navnet skal stå som kilde: "according to X", "X says/reports/...", "X's study".
  const res = ord.map((o) => {
    const n = o.length <= 4 ? o.toUpperCase() : o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fl = o.length <= 4 ? '' : 'i';
    return new RegExp(`(\\b(according to|per|cited by|reported by|published by|data from|figures from|research from|by)\\s+(the\\s+)?${n}\\b)|(\\b${n}('s)?\\s+([\\w-]+\\s+){0,3}?(says|said|reports?|reported|explains?|explained|notes?|noted|states?|stated|found|finds|estimates?|estimated|announced|describes?|described|highlights?|highlighted|shows?|showed|confirms?|confirmed|lists?|listed|recommends?|warns?|warned|defines?|defined|demonstrated|measured|calculated|walkthrough|documentation|data|survey|study|report|research|researchers|scientists|engineers|team|blog|guide|tests?)\\b)`, fl);
  });
  return { test: (s) => res.some((r) => r.test(s)) };
}

// ---------- kildernes tekst ----------
const cache = new Map();
export async function hentKilde(url) {
  if (cache.has(url)) return cache.get(url);
  let ud = null;
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechFeedWatch-kontrol/1.0; +https://techfeedwatch.com/editorial-guidelines/)', Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5' } });
    if (r.ok) {
      const type = r.headers.get('content-type') || '';
      if (/pdf/i.test(type) || /\.pdf(\?|$)/i.test(url)) {
        const buf = Buffer.from(await r.arrayBuffer());
        // PDF'en sendes som fil til modellen (koden kan ikke læse den) - citatet kan derfor ikke kontrolleres af koden
        if (buf.length > 1000 && buf.length < 15e6) ud = { pdf: buf.toString('base64') };
      } else {
        const html = await r.text();
        const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, ' ').replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&#x27;/g, "'").replace(/\s+/g, ' ').trim();
        // Under 1.500 tegn er det ikke artiklens tekst (cookie-mur, JavaScript-side, 202 uden indhold)
        if (tekst.length >= 1500) ud = { tekst: tekst.slice(0, KILDE_TEGN) };
      }
    }
  } catch { /* kunne ikke hentes */ }
  cache.set(url, ud);
  return ud;
}
const kildeDel = (k, prompt) => (k.pdf ? [{ inlineData: { mimeType: 'application/pdf', data: k.pdf } }, { text: prompt }] : prompt);
// Står citatet på siden? (Kun for HTML - en PDF kan koden ikke læse.) De første 100 tegn skal stå ordret.
// 20/11 (målt): modellen forkorter citater med "..." - hver del (mindst 15 tegn) skal så stå på siden.
export const citatPaaSiden = (k, q) => {
  if (k?.pdf) return null;
  const dele = String(q || '').split(/\.{3}|…/).map((d) => norm(d)).filter((d) => d.length >= 15);
  if (!dele.length) return false;
  const side = norm(k.tekst);
  return dele.every((d) => side.includes(d.slice(0, 100)));
};
const json = (t) => { try { const m = String(t || '').match(/\[[\s\S]*\]/); const a = m ? JSON.parse(m[0]) : null; return Array.isArray(a) ? a : null; } catch { return null; } };
// Tidsgrænse (20/11-2026, målt): et Gemini-kald uden svar ventede for evigt - to målinger døde i stilhed samme dag.
// Nu opgives et kald efter grænsen og prøves igen (højst 3 gange). Kaldtiderne gemmes, så grænserne kan sættes efter tal.
// Målt 20/11 (82 kald): low median 3 s / længst 8 s · medium median 55 s / længst 300+ s · high median 389 s.
export const KALD_GRAENSE_SEK = { low: 90, medium: 360, high: 420 };
export const kaldTider = [];
const medGraense = (p, sek) => { let tm; return Promise.race([p, new Promise((_, nej) => { tm = setTimeout(() => nej(new Error(`intet svar efter ${sek} s`)), sek * 1000); })]).finally(() => clearTimeout(tm)); };
async function kald(genAI, input, { soeg = false, taenk = 'low', loft = 16384 } = {}) {
  for (let forsoeg = 1; forsoeg <= 3; forsoeg++) {
    const t0 = Date.now();
    try {
      const r = await medGraense(hentModel(genAI, { model: KONTROL_MODEL, ...(soeg ? { tools: [{ googleSearch: {} }] } : {}), generationConfig: { temperature: 0, maxOutputTokens: loft, thinkingConfig: { thinkingLevel: taenk } } }).generateContent(input), KALD_GRAENSE_SEK[taenk] || 300);
      kaldTider.push({ taenk, soeg, sek: Math.round((Date.now() - t0) / 1000) });
      const a = json(r.response.text());
      if (a) return a;
      throw new Error('svaret kunne ikke læses');
    } catch (e) {
      kaldTider.push({ taenk, soeg, sek: Math.round((Date.now() - t0) / 1000), fejl: String(e.message).slice(0, 60) });
      console.log(`   ⚠️ kontrollant-kald fejlede (forsøg ${forsoeg} af 3): ${String(e.message).split('\n')[0].slice(0, 160)}`);
      if (forsoeg < 3) await new Promise((v) => setTimeout(v, forsoeg * 20000));
    }
  }
  return null;
}

// ---------- A. Kildetekst ----------
const erForside = (url) => { try { const u = new URL(url); return /^\/?(index\.html?)?$/i.test(u.pathname) && !u.search; } catch { return false; } };
const TILLAEGGER = /\b(according to|says?|said|explains?|explained|describes?|described|reports?|reported|notes?|noted|states?|stated|found|finds|warns?|defines?|highlights?|shows?|confirms?)\b/i;
// Hvilke sætninger nævner hvilke kilder? Et link i sætningen gælder alene (linket SKAL sige det);
// ellers alle artiklens kilder, hvis navn står i sætningen (fx "IBM" -> alle ibm.com-sider: én skal sige det).
export function kildeSaetninger(f, kanal = '') {
  const liste = kildeliste(f.brodtekst);
  const kanalRe = kanal ? new RegExp(kanal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const ud = [];
  const tilfoej = (tekst, links, felt, md = '') => {
    if (kanalRe && kanalRe.test(tekst)) return; // videoens sætninger: kilden er videoen, ikke en webside
    const urls = links.filter((u) => !/youtube\.com|youtu\.be|techfeedwatch\.com/.test(u) && !/^\//.test(u));
    const kandidater = urls.length ? urls : liste.filter((k) => kildeNavneRe(k.vaert).test(tekst)).map((k) => k.url);
    if (kandidater.length) ud.push({ tekst, md, urls: [...new Set(kandidater)], felt, link: urls.length > 0 });
  };
  for (const s of saetningerMedLinks(f.brodtekst)) tilfoej(s.tekst, s.links, 'brodtekst', s.md);
  const split = (t) => udenMd(t).split(/(?<=[.!?])\s+(?=[A-Z])/).filter((x) => x.split(/\s+/).length >= 5);
  for (const s of split(f.resume)) tilfoej(s, [], 'resume');
  for (const q of f.faqs || []) for (const s of split(q.answer)) tilfoej(s, [], 'faq');
  for (const k of f.faktaboks || []) if (k.url) tilfoej(udenMd(k.text), [k.url], 'faktaboks');
  return ud;
}

const domPrompt = (url, ss) => `Below is the text of a web page or document (${url}). An article attributes the numbered sentences to it.
For each sentence decide, using ONLY this source:
- SUPPORTED: the source states the facts, figures, names and dates in the sentence. Different wording, a simpler explanation or a detail that follows directly from the source (for example a month that is the source's own publication date) is still SUPPORTED.
- PARTLY: a SPECIFIC fact, figure, date, name or claim in the sentence is not in the source or differs from it (say exactly which in "missing"). Add "major": true if that part changes what a reader would believe (a wrong figure, date, name, finding or who said it); "major": false if it is a minor detail, framing or a reasonable simplification.
- NO: the source does not say it, or says something different (say what the source actually says in "missing").
Judge the facts, not the style.
For SUPPORTED and PARTLY give "quote": one passage copied WORD FOR WORD from the source, at most 40 words, that backs it.
Return ONLY a JSON array: [{"n":1,"verdict":"SUPPORTED","quote":"...","missing":""}]

SENTENCES:
${ss.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

// Holder citatet ikke (HTML), regnes dommen som "ikke vist" - modellen må ikke kunne bekræfte med et opdigtet citat.
function vurder(k, d) {
  const v = String(d?.verdict || '').toUpperCase();
  if (v !== 'SUPPORTED' && v !== 'PARTLY') return { ok: false, grund: String(d?.missing || 'the source does not say this').slice(0, 300) };
  const ok = citatPaaSiden(k, d.quote);
  // Citatet står ikke ordret på siden: hverken bekræftet eller dømt (usikker) - samme lære som slutkontrollen 25/10:
  // modellen gengiver ofte et rigtigt citat en anelse forkert. Ekspertlæsningen (lag B) læser stadig sætningen.
  if (ok === false) return { ok: false, usikker: true, grund: 'the quoted passage is not on the page' };
  // 20/11 (målt): "PARTLY" for småting gav klodsede omskrivninger af rigtige sætninger - kun væsentlige rettes.
  if (v === 'PARTLY' && d.major === false) return { ok: true, mindre: String(d.missing || '').slice(0, 200), quote: d.quote };
  if (v === 'PARTLY') return { ok: false, delvis: true, grund: `only partly in the source: ${String(d.missing || '').slice(0, 250)}`, quote: d.quote, url: d.url };
  return { ok: true, quote: d.quote };
}

export async function lagA(genAI, f, kanal, log) {
  const ss = kildeSaetninger(f, kanal);
  const rap = { tjekket: ss.length, ok: 0, ikkeLaest: 0, fejl: [] };
  if (!ss.length) return rap;
  const urls = [...new Set(ss.flatMap((s) => s.urls))];
  const domme = new Map(); // tekst -> [{url, ok, grund, quote}]
  for (const url of urls) {
    const mine = ss.filter((s) => s.urls.includes(url));
    // 20/11 (målt): "[NIST](https://www.nist.gov/) describes ..." gik igennem - en forside er aldrig belæg for en påstand.
    // Koden afgør det: sætninger, der tillægger kilden noget, og kun peger på en forside, regnes som forkert kilde.
    if (erForside(url)) {
      for (const s of mine) if (s.link && TILLAEGGER.test(s.tekst)) domme.set(s.tekst, [...(domme.get(s.tekst) || []), { url, laest: true, ok: false, grund: 'the link goes to the front page of the site, not to a page that says this' }]);
      continue;
    }
    const k = await hentKilde(url);
    if (!k) { for (const s of mine) domme.set(s.tekst, [...(domme.get(s.tekst) || []), { url, laest: false }]); continue; }
    const svar = await kald(genAI, kildeDel(k, `${domPrompt(url, mine.map((s) => s.tekst))}\n\nSOURCE TEXT:\n${k.tekst || '(attached PDF)'}`));
    mine.forEach((s, i) => {
      const d = (svar || []).find((x) => x && Number(x.n) === i + 1);
      if (process.env.KONTROL_DEBUG) log(`     [${new URL(url).hostname}] ${d?.verdict} citat-på-siden=${d ? citatPaaSiden(k, d.quote) : '-'} :: ${s.tekst.slice(0, 70)}\n        q: ${String(d?.quote || '').slice(0, 120)}\n        m: ${String(d?.missing || '').slice(0, 120)}`);
      domme.set(s.tekst, [...(domme.get(s.tekst) || []), d ? { ...vurder(k, d), url, laest: true } : { url, laest: false }]);
    });
  }
  for (const s of ss) {
    const d = domme.get(s.tekst) || [];
    if (d.some((x) => x.ok)) { rap.ok++; continue; }
    if (!d.some((x) => x.laest)) { rap.ikkeLaest++; continue; } // ingen af kilderne kunne læses: ikke dømt
    // Kandidaterne er alternativer (fx to IBM-sider): én, der bekræfter med et citat, der ikke står helt ordret, gør
    // sætningen usikker - ikke forkert - selvom en anden kandidat siger nej.
    if (d.some((x) => x.usikker)) { rap.usikre = (rap.usikre || 0) + 1; continue; }
    rap.fejl.push({ ...s, grund: d.filter((x) => x.laest).map((x) => `${x.url}: ${x.grund}`).join(' | '), delvis: d.find((x) => x.delvis) });
  }
  log(`   kontrollant A: ${rap.tjekket} kildesætninger - ${rap.ok} står i kilden, ${rap.fejl.length} gør ikke, ${rap.ikkeLaest} kilde(r) kunne ikke læses`);
  if (!rap.fejl.length) return rap;

  // Står det hos en ANDEN af artiklens kilder? (fx IBM's blog i stedet for IBM's kursusside)
  const alle = kildeliste(f.brodtekst);
  // Ét kald pr. kilde med alle de sætninger, der endnu mangler en kilde (billigere end ét pr. sætning).
  for (const k of alle) {
    const mangler = rap.fejl.filter((x) => !x.rigtigKilde && !x.urls.includes(k.url));
    if (!mangler.length) continue;
    const kt = await hentKilde(k.url);
    if (!kt) continue;
    const svar = await kald(genAI, kildeDel(kt, `${domPrompt(k.url, mangler.map((x) => x.tekst))}\n\nSOURCE TEXT:\n${kt.tekst || '(attached PDF)'}`));
    mangler.forEach((x, i) => {
      const d = (svar || []).find((y) => y && Number(y.n) === i + 1);
      const v = d && vurder(kt, d);
      if (v?.ok) x.rigtigKilde = { ...k, quote: v.quote };
    });
  }
  return rap;
}

// Rettelse af kildefejl: KUN ud fra kildens eget citat (ingen søgning, ingen hukommelse).
async function retKildefejl(genAI, fejl) {
  if (!fejl.length) return [];
  const p = `Each numbered sentence below is from an article. It names a source, but that source does not say it as written.
Rewrite each sentence so it states ONLY what the EVIDENCE supports, and name the source of the evidence in the sentence.
Change as little as possible: keep the sentence's point, wording and style, and change only the part the evidence does not support. Do not start with "According to" unless the original did.
If the original sentence had a link, write the source name as a markdown link: [Name](url) - the url of the EVIDENCE. Plain English, one or two sentences.
If there is no evidence, or the evidence supports no part of the sentence, write "REMOVE".
Return ONLY a JSON array: [{"n":1,"fix":"..."}]

${fejl.map((x, i) => `${i + 1}. SENTENCE: ${x.tekst}\n   PROBLEM: ${x.grund}\n   EVIDENCE: ${x.rigtigKilde ? `(${x.rigtigKilde.titel} - ${x.rigtigKilde.url}) "${x.rigtigKilde.quote}"` : x.delvis?.quote ? `(${x.delvis.url}) "${x.delvis.quote}"` : '(none)'}`).join('\n')}`;
  const svar = await kald(genAI, p);
  return fejl.map((_, i) => String((svar || []).find((y) => y && Number(y.n) === i + 1)?.fix || '').trim());
}

// ---------- C. Faste regler ----------
const NAVNLOES = /\b(researchers|experts|scientists|analysts|studies|reports|critics|observers|industry research|research|data|surveys?)\s+(estimates?|says?|believes?|suggests?|shows?|found|agrees?|warns?|predicts?|argues?|indicates?)\b/i;
export const erNavnloes = (s) => NAVNLOES.test(s) && !/\b(at|from|led by|by)\s+(the\s+)?[A-Z]/.test(s) && !/\[[^\]]+\]\(https?:/.test(s);

// ---------- Værn mod kontrollantens egne fejl (20/11-2026, målt på 10 artikler) ----------
// 1. En rettelse må ikke tilføje links, sætningen ikke havde (målt: et link til en tilmeldingsside blev sat ind).
//    Tilladt er kun links, der stod i den oprindelige sætning, og artiklens egne kilder.
// 2. En rettelse må ikke gøre kilden navnløs (målt: "In his analysis, 61%" -> "Industry research indicates 61%").
//    Så fjernes sætningen hellere.
export function vaernRettelse(foerMd, efter, tilladte = []) {
  if (!efter) return '';
  const ok = new Set([...String(foerMd || '').matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]).concat(tilladte));
  let ud = String(efter).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, tekst, url) => (ok.has(url) ? m : tekst));
  ud = ud.replace(/(?<!\]\()https?:\/\/\S+/g, (u) => (ok.has(u) ? u : '')).replace(/\s{2,}/g, ' ').trim();
  if (erNavnloes(udenMd(ud)) && !erNavnloes(udenMd(foerMd))) return '';
  return ud;
}
export function lagC(f) {
  const ss = saetningerMedLinks(f.brodtekst).map((s) => s.tekst);
  // Navngivet er det, når der står hvem: "researchers at MIT", "researchers led by Professor X", "a study by Y"
  const navnloese = ss.filter(erNavnloes);
  const afsnit = brod(f.brodtekst).split(/\n\s*\n/).filter((a) => !/^\s*(#|\||[-*] )/.test(a));
  const jegAfsnit = afsnit.filter((a) => /\b(I|I'm|I've|I'd|my|me|[Ww]e|[Oo]ur)\b/.test(udenMd(a).replace(/"[^"]*"/g, ''))).length;
  const meta = String(f.meta || '').length;
  return { navnloese, jegAfsnit, meta };
}

// ---------- B. Ekspertlæsning ----------
const artikelTekst = (f) => `TITLE: ${f.titel}\nMETA: ${f.meta}\nSUMMARY: ${f.resume}\n\nFAQ:\n${(f.faqs || []).map((q) => `Q: ${q.question}\nA: ${q.answer}`).join('\n')}\n\nKEY FACTS:\n${(f.faktaboks || []).map((k) => `- ${k.text} (${k.source})`).join('\n')}\n\nBODY:\n${brod(f.brodtekst)}`;
function ekspertPrompt(f, skal) {
  return `You are a senior subject-matter expert and editor. Review this article before it is published. Read ALL of it - title, meta, summary, FAQ, key facts and body - as one piece.
Report ONLY real problems of these types:
- MISCONCEPTION: a statement that is false, or a popular misconception stated as fact (an explanation experts in the field reject), even if the article attributes it to a source.
- CONTRADICTION: two places in the article that contradict each other. Report the wrong one.
- OVERCLAIM: stronger than the evidence allows (never, always, guarantees, ultra-secure, will), or a prediction stated as fact.
- UNNAMED: "researchers estimate", "experts say", "studies show" without saying who - or a person named without saying who they are. The video's own creator or channel, named by its channel name, IS named - do not report it.
- UNSUPPORTED: a specific fact, date or figure that no reliable source supports.
The article is based on a video you cannot see. Examples, analogies, demonstrations and statements that describe what the video or its speaker shows come from the video - never report those as UNSUPPORTED just because you cannot find them online. Report them only if they are factually wrong (MISCONCEPTION).
Do NOT report style, wording you would merely prefer, or simplifications that are still correct.
When a misconception or wrong claim appears, report EVERY place it appears as its own item - headings, summary, FAQ answers, key facts, table rows and other sentences that repeat it in different words. One missed copy means the error is published.
Use Google Search to check facts.
For each problem: "sentence": copied WORD FOR WORD from the article (one sentence, FAQ answer sentence or table row); "type"; "why": one line; "fix": the corrected sentence in the same plain style (keep any markdown link and who said it), or "REMOVE".
If the META is shorter than 120 or longer than 160 characters, add {"sentence": <the META text>, "type": "META", "why": "...", "fix": <a new meta description of 140-155 characters>}.
${skal.length ? `These sentences break the site's rule "always name the source" - report each one (UNNAMED) with a fix that names who (a real, checkable source - if the claim comes from the video, attribute it to the video's speaker or channel). Never turn it into a plain statement of fact without a source; if no source can be named, "fix" is "REMOVE":\n${skal.map((s) => `- ${s}`).join('\n')}\n` : ''}
Return ONLY a JSON array, [] if nothing is wrong: [{"sentence":"...","type":"MISCONCEPTION","why":"...","fix":"..."}]

${artikelTekst(f)}`;
}
async function genkontrol(genAI, f, rettede) {
  if (!rettede.length) return [];
  const p = `An editor corrected these sentences in an article titled "${f.titel}". Check each corrected sentence with Google Search.
"OK" if it is accurate and fairly attributed; otherwise "WRONG" with "fix" (a correct version) or "REMOVE".
Return ONLY a JSON array: [{"n":1,"verdict":"OK"}]

${rettede.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  // 20/11 (målt): høj tænkning her og i ekspertlæsningen gav 100.000 output-tokens (0,38 af 0,49 USD) - mellem er nok
  const svar = await kald(genAI, p, { soeg: true, taenk: 'medium' });
  if (!svar) return null;
  return rettede.map((_, i) => { const d = svar.find((y) => y && Number(y.n) === i + 1); return d && String(d.verdict).toUpperCase() === 'WRONG' ? String(d.fix || 'REMOVE').trim() : null; });
}


// ---------- D. Påstand for påstand (20/11-2026, Jacob: "det skal rettes en gang for alle") ----------
// Hvorfor: ekspertlæsningen (B) læser hele artiklen i ét hug og vælger selv, hvad den hæfter sig ved - målt 20/11
// fandt den 5 fejl i én kørsel og 1 i den næste på samme artikel. Her deler KODEN hele artiklen op (hver sætning,
// overskrift, tabelrække, FAQ-svar og faktapunkt), og hver bunke tjekkes med søgning - intet kan springes over.
// Det lukker også hullet i lag A: "NIST/MIT/en undersøgelse siger ..." tjekkes mod det, kilden faktisk siger,
// også når kilden ikke står i artiklens kildeliste (målt 20/11: en falsk NIST-påstand gik igennem A).
const BUNKE = 15, SAMTIDIGE = 4;
export function alleUdsagn(f) {
  const ud = [], set = new Set();
  const add = (t, felt) => { const s = udenMd(t).replace(/\s+/g, ' ').trim(); if (s.split(/\s+/).length >= 4 && !set.has(s)) { set.add(s); ud.push({ tekst: s, felt }); } };
  const split = (t) => udenMd(t).split(/(?<=[.!?])\s+(?=[A-Z"(\[])/);
  for (const s of split(f.resume)) add(s, 'resume');
  for (const q of f.faqs || []) for (const s of split(q.answer)) add(s, 'faq');
  for (const k of f.faktaboks || []) add(k.text, 'faktaboks');
  for (const linje of brod(f.brodtekst).split('\n')) {
    const l = linje.trim();
    if (!l || /^>/.test(l)) continue;
    if (/^#{2,}\s/.test(l)) { add(l, 'overskrift'); continue; }
    if (/^\|/.test(l)) { if (!/^\|[\s:|-]+\|?$/.test(l)) add(l, 'tabel'); continue; }
    for (const s of split(l.replace(/^[-*]\s+|^\d+\.\s+/, ''))) add(s, 'brodtekst');
  }
  return ud;
}
const udsagnPrompt = (f, kanal, ss) => `You are a careful fact-checker for a tech website. Below is the full article for context, then numbered statements copied from it.
Check EVERY numbered statement, one by one, with Google Search. A statement is OK if a reader would not be misled by it. Otherwise report it as one of:
- WRONG_FACT: a figure, date, price, spec, name or event that is wrong.
- MISCONCEPTION: an explanation experts reject, or a popular myth stated as fact.
- WRONG_ATTRIBUTION: the statement says a named organization, company, study or person says, found or defines something, and that source does not say it (or says something different). Search for what that source actually says.
- OVERCLAIM: stronger than the evidence (always, never, every, guarantees, ensures, will) or a prediction stated as fact.
- UNNAMED: an authority without a name ("studies show", "researchers estimate", "experts say"), or a person named without saying who they are. The video's own channel or speaker, named by name, IS named.
- CONTRADICTION: contradicts another place in the article.
The article is based on a YouTube video${kanal ? ` by "${kanal}"` : ''} that you cannot see. Statements that report what the video or its speaker says, shows or uses as an example come from the video: do not report them just because you cannot find them online - only if they are factually wrong.
Do not report style, wording you would merely prefer, or simplifications that are still correct. When unsure, search before deciding.
For each problem: "fix" = the statement corrected with as few changes as possible, in the same style, keeping any markdown link and who said it (a table row stays a table row, a heading stays a heading); or "REMOVE" if it cannot be made true.
Return ONLY a JSON array with one item per problem - leave out OK statements, [] if all are OK: [{"n":3,"type":"WRONG_FACT","why":"one line: what is actually true","fix":"..."}]

ARTICLE:
${artikelTekst(f)}

STATEMENTS:
${ss.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
async function iBunker(opg, n, fn) {
  const ud = new Array(opg.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, opg.length) }, async () => { while (i < opg.length) { const j = i++; ud[j] = await fn(opg[j]); } }));
  return ud;
}
export async function lagD(genAI, f, kanal, log) {
  // Kun til måling (målestokken): KONTROL_UDEN_D=1 slår lag D fra, så før/efter kan sammenlignes på samme kode
  if (process.env.KONTROL_UDEN_D) return { tjekket: 0, fund: [], tabt: 0, bunker: 0 };
  const alle = alleUdsagn(f);
  const bunker = [];
  for (let i = 0; i < alle.length; i += BUNKE) bunker.push(alle.slice(i, i + BUNKE).map((x) => x.tekst));
  const svar = await iBunker(bunker, SAMTIDIGE, (ss) => kald(genAI, udsagnPrompt(f, kanal, ss), { soeg: true, taenk: 'medium', loft: 16384 }));
  const fund = [];
  svar.forEach((sv, b) => (sv || []).forEach((x) => {
    const s = bunker[b][Number(x?.n) - 1];
    if (s && x.type && x.fix !== undefined) fund.push({ sentence: s, type: String(x.type).toUpperCase(), why: x.why, fix: x.fix, lag: 'påstand' });
  }));
  const tabt = svar.filter((x) => x === null).length;
  log(`   kontrollant D: ${alle.length} påstande i ${bunker.length} bunker - ${fund.length} fund${tabt ? ` - ${tabt} bunke(r) fejlede` : ''}${fund.length ? '\n' + fund.map((x) => `     - [${x.type}] ${x.sentence.slice(0, 110)} (${String(x.why).slice(0, 110)})`).join('\n') : ''}`);
  return { tjekket: alle.length, fund, tabt, bunker: bunker.length };
}

async function bekraeftSletninger(genAI, f, sletninger) {
  if (!sletninger.length) return [];
  const p = `A checker wants to DELETE these sentences from an article titled "${f.titel}" because it believes they are wrong. Check each ORIGINAL sentence with Google Search, in the context of the article.
"WRONG" if the sentence really is false or misleading; "OK" if it is accurate (a correct statement, a correct simplification, or a correct step in an explanation).
Return ONLY a JSON array: [{"n":1,"verdict":"WRONG"}]

${sletninger.map((x, i) => `${i + 1}. ${x.saetning}\n   (checker's reason: ${String(x.grund).slice(0, 200)})`).join('\n')}`;
  const svar = await kald(genAI, p, { soeg: true, taenk: 'medium' });
  if (!svar) return null;
  return sletninger.map((_, i) => String(svar.find((y) => y && Number(y.n) === i + 1)?.verdict || '').toUpperCase() === 'OK');
}

// ---------- Kontrollanten ----------
// f = { titel, meta, resume, faqs, brodtekst, faktaboks } (som laesFelter giver det) - ÆNDRES på stedet.
// Fejler et lag hos Gemini, kører resten, og rapporten siger det (kunneIkke) - kladden gemmes alligevel, så
// Jacob kan se det på /godkend, i stedet for at en betalt artikel smides ud.
export async function kontrollant(genAI, f, { kanal = '', log = console.log } = {}) {
  const usdFoer = forbrug.usd;
  const foer = { brodtekst: f.brodtekst, faqs: (f.faqs || []).map((q) => ({ ...q })) };
  const rap = { model: KONTROL_MODEL, kildeTjekket: 0, kildeOk: 0, kildeIkkeLaest: 0, ekspertFund: 0, regler: null, rettelser: [], ikkeRettet: [], kunneIkke: [], usd: 0 };

  const regler = lagC(f);
  rap.regler = { navnloese: regler.navnloese.length, jegAfsnit: regler.jegAfsnit, meta: regler.meta };
  // A, B og D læser alle den urørte artikel - de køres samtidig (20/11: ellers ca. 15 min pr. artikel)
  const [a, b, d] = await Promise.all([
    lagA(genAI, f, kanal, log),
    // 20/11 (målt): høj tænkning tog 6½ min pr. kald og ramte grænsen 2 af 6 gange - påstandstjekket (D) tager nu
    // det systematiske, så ekspertlæsningen kører med mellem
    kald(genAI, ekspertPrompt(f, regler.navnloese), { soeg: true, taenk: 'medium', loft: 32768 }),
    lagD(genAI, f, kanal, log),
  ]);
  Object.assign(rap, { kildeTjekket: a.tjekket, kildeOk: a.ok, kildeIkkeLaest: a.ikkeLaest, paastandeTjekket: d.tjekket, paastandFund: d.fund.length });
  if (d.tabt) rap.kunneIkke.push(`påstandstjek (${d.tabt} af ${d.bunker} bunker)`);
  if (b === null) rap.kunneIkke.push('ekspertlæsning');
  const ekspert = (b || []).filter((x) => x && x.sentence && x.fix !== undefined);
  rap.ekspertFund = ekspert.length;
  log(`   kontrollant B: ${ekspert.length} fund${ekspert.length ? '\n' + ekspert.map((x) => `     - [${x.type}] ${String(x.sentence).slice(0, 110)} (${String(x.why).slice(0, 110)})`).join('\n') : ''}`);

  // Saml fund: kildefejl først (rettet ud fra kildens egen tekst), så ekspertens.
  const fund = [];
  const nyeA = await retKildefejl(genAI, a.fejl);
  const kildeUrls = kildeliste(f.brodtekst).map((k) => k.url);
  const mdAf = (tekst) => saetningerMedLinks(f.brodtekst).find((s) => s.tekst === tekst)?.md || tekst;
  a.fejl.forEach((x, i) => {
    let fix = /^remove$/i.test(nyeA[i]) ? '' : vaernRettelse(x.md || x.tekst, nyeA[i], [x.rigtigKilde?.url, x.delvis?.url, ...kildeUrls].filter(Boolean));
    // 3. Forkert link, men rigtig påstand: koden skifter kun linket - sætningen skrives ikke om (målt: rigtige
    //    sætninger blev til klodsede "According to X ..."-sætninger).
    if (x.rigtigKilde && x.link && x.md && x.urls.length === 1 && x.md.includes(`(${x.urls[0]})`)) fix = x.md.split(`(${x.urls[0]})`).join(`(${x.rigtigKilde.url})`);
    fund.push({ lag: 'kilde', type: x.rigtigKilde ? 'WRONG_SOURCE' : x.delvis ? 'PARTLY' : 'NOT_IN_SOURCE', saetning: x.tekst, rettet: fix, grund: x.rigtigKilde ? `står hos ${x.rigtigKilde.url}, ikke den nævnte kilde` : x.grund });
  });
  const ordAf = (t) => new Set(String(t).toLowerCase().match(/[a-z0-9]+/g) || []);
  const overlap = (s, t) => { const A = ordAf(s), B = ordAf(t); return A.size ? [...A].filter((w) => B.has(w)).length / A.size : 0; };
  // Påstandstjekket (D) først - det er det mest systematiske; ekspertens fund på samme sætning springes så over
  // 20/11 (målt): KEY FACTS vises for modellen som "tekst (kilde)" - den kopierer kilden med, og rettelsen kunne så
  // ikke findes i faktaboksen. Står sætningen i faktaboksen uden parentesen, bruges den uden.
  const fb = (f.faktaboks || []).map((k) => udenMd(k.text).replace(/\s+/g, ' ').trim());
  const udenKilde = (t) => { const u = String(t || '').replace(/\s*\((?:[^()]|\([^()]*\))*\)\s*$/, '').trim(); return u !== String(t || '').trim() && fb.some((k) => k === u || k.startsWith(u.slice(0, 80))) ? u : t; };
  for (const x0 of [...d.fund, ...ekspert]) {
    const x = { ...x0, sentence: udenKilde(udenMd(x0.sentence)), fix: typeof x0.fix === 'string' && !/^remove$/i.test(x0.fix.trim()) ? udenKilde(x0.fix) : x0.fix };
    const s = udenMd(x.sentence);
    const lag = x.lag || 'ekspert';
    if (x.type === 'META') { if (x.fix && !/^remove$/i.test(x.fix)) { rap.rettelser.push({ lag: 'ekspert', type: 'META', foer: f.meta, efter: x.fix.trim(), grund: String(x.why || '') }); f.meta = x.fix.trim(); } continue; }
    if (fund.some((y) => overlap(s, y.saetning) >= 0.6)) continue; // kildetjekket har allerede taget den
    // Værn 5 (20/11, målt): "uden belæg" rettes eller slettes aldrig af sig selv - kontrollanten kan ikke se videoen,
    // og en kørsel ville slette videoens eget eksempel som "opdigtet". Jacob ser fundet og afgør det selv.
    if (String(x.type).toUpperCase() === 'UNSUPPORTED') { rap.ikkeRettet.push({ lag, type: 'UNSUPPORTED', saetning: s, grund: String(x.why || '') }); continue; }
    fund.push({ lag, type: String(x.type || '').toUpperCase(), saetning: s, rettet: /^remove$/i.test(String(x.fix).trim()) ? '' : vaernRettelse(mdAf(s), String(x.fix).trim(), kildeUrls), grund: String(x.why || '') });
  }

  // Rettelserne læses igen (med søgning). Holder en ikke, bruges genkontrollens bud - eller sætningen fjernes.
  const medRet = fund.filter((x) => x.rettet);
  const igen = await genkontrol(genAI, f, medRet.map((x) => x.rettet));
  if (igen === null && medRet.length) rap.kunneIkke.push('genkontrol');
  (igen || []).forEach((ny, i) => { if (ny !== null) { medRet[i].grund += ' (rettelsen holdt ikke - rettet igen)'; medRet[i].rettet = /^remove$/i.test(ny) ? '' : vaernRettelse(mdAf(medRet[i].saetning), ny, kildeUrls); } });

  // Værn 7 (20/11, målt): en sletning fra ekspert/påstandstjek bekræftes med søgning - en korrekt sætning om CNOT
  // blev slettet som "forkert". Siger bekræftelsen, at sætningen er rigtig, bliver den stående (vises som "tjek selv").
  const sletninger = fund.filter((x) => x.lag !== 'kilde' && !x.rettet);
  const dom = await bekraeftSletninger(genAI, f, sletninger);
  if (dom === null && sletninger.length) rap.kunneIkke.push('bekræftelse af sletninger');
  (dom || []).forEach((ok, i) => { if (ok) { const x = sletninger[i]; rap.ikkeRettet.push({ lag: x.lag, type: x.type, saetning: x.saetning, grund: `${x.grund} - men en ny søgning siger, at sætningen er rigtig; ikke slettet` }); fund.splice(fund.indexOf(x), 1); } });

  // Værn 6 (20/11, målt): en "rettelse", der er identisk med sætningen, er ingen rettelse - den vises som "ikke rettet"
  // 20/11 (målt): sammenlignes MED links - en rettelse, der kun skifter et forkert link til det rigtige, er en rigtig rettelse
  const norm = (t) => String(t || '').replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  for (let i = fund.length - 1; i >= 0; i--) {
    if (fund[i].rettet && norm(fund[i].rettet) === norm(mdAf(fund[i].saetning))) { rap.ikkeRettet.unshift({ lag: fund[i].lag, type: fund[i].type, saetning: fund[i].saetning, grund: fund[i].grund.replace(' (rettelsen holdt ikke - rettet igen)', '') }); fund.splice(i, 1); }
  }

  if (fund.length) {
    const ikke = anvend(f, fund.map((x) => ({ saetning: x.saetning, rettet: x.rettet })), log);
    if (ikke) rap.kunneIkke.push(`${ikke} fund kunne ikke findes i teksten`);
    rap.sammenhaeng = await reparer(genAI, hentModel, KONTROL_MODEL, f, foer, log);
  }
  rap.rettelser.push(...fund.map((x) => ({ lag: x.lag, type: x.type, foer: x.saetning, efter: x.rettet, grund: x.grund })));
  rap.usd = Math.round((forbrug.usd - usdFoer) * 10000) / 10000;
  log(`   kontrollant: ${rap.rettelser.length} rettelse(r) (${rap.rettelser.filter((x) => !x.efter).length} fjernet), ${rap.usd} USD${rap.kunneIkke.length ? ` - kunne ikke: ${rap.kunneIkke.join(', ')}` : ''}`);
  return rap;
}

// Indgangen fra gemKladde: hele artiklens markdown ind, rettet markdown + rapport ud.
export async function kontrollerMarkdown(genAI, markdown, log = console.log) {
  const { laesFelter, medFelter } = await import('./artikelfelter.mjs');
  const l = laesFelter(markdown);
  const kanal = l.felt('channelTitle');
  const kontrol = await kontrollant(genAI, l.f, { kanal, log });
  return { markdown: medFelter(markdown, l).raw, kontrol };
}
