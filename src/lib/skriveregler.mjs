// Skriveregler for robottens artikler (fase 2, 6/10-2026).
// Rene funktioner uden net og uden Gemini, så de kan måles på ALLE udgivne
// artikler (_maal-skriveregler.mjs) og afprøves af test-skriveregler.mjs, før
// robotten (add-video.mjs) bruger dem. Arbejder på markdown — ikke HTML.
//
// Idéerne er afprøvet på en anden blog 5.-6/10; koden her er skrevet til
// techfeedwatch og importerer intet udefra.
import { kerneord, stamme } from './headline.mjs';

// ---------------------------------------------------------------------------
// Grundlag: blokke, ord og sætninger
// ---------------------------------------------------------------------------

// Fjerner frontmatter, hvis den er med.
// En BOM (usynligt tegn først i filen, som PowerShell sætter ind) fjernes også —
// ellers ses frontmatter ikke som frontmatter og tælles som tekst (målt 7/10).
export function brodtekst(md) {
  const s = String(md).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const m = s.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? s.slice(m[0].length) : s;
}

const LISTEPUNKT = /^\s{0,3}(?:[-*+]|\d{1,2}[.)])\s+/;
const TABELLINJE = /^\s*\|.*\|\s*$/;
const OVERSKRIFT = /^#{1,6}\s/;

// Deler brødteksten i blokke: overskrift, afsnit (p), liste, tabel, kode, citat.
// Målerunden 6/10 lærte: en liste kan stå lige under et afsnit UDEN tom linje,
// så blokkene findes linje for linje, ikke kun ved tomme linjer.
export function blokke(md) {
  const linjer = brodtekst(md).split('\n');
  const ud = [];
  let cur = null;
  const luk = () => { if (cur) { cur.tekst = cur.linjer.join('\n'); ud.push(cur); cur = null; } };
  for (let i = 0; i < linjer.length; i++) {
    const l = linjer[i];
    if (/^\s*$/.test(l)) {
      // En tom linje mellem to listepunkter afbryder ikke listen.
      if (cur && cur.type === 'liste') {
        let j = i + 1; while (j < linjer.length && /^\s*$/.test(linjer[j])) j++;
        if (j < linjer.length && LISTEPUNKT.test(linjer[j])) continue;
      }
      luk(); continue;
    }
    if (/^```/.test(l)) { luk(); cur = { type: 'kode', linjer: [l] }; i++; while (i < linjer.length && !/^```/.test(linjer[i])) cur.linjer.push(linjer[i++]); if (i < linjer.length) cur.linjer.push(linjer[i]); luk(); continue; }
    let type;
    if (OVERSKRIFT.test(l)) type = 'h';
    else if (LISTEPUNKT.test(l)) type = 'liste';
    else if (TABELLINJE.test(l)) type = 'tabel';
    else if (/^>/.test(l)) type = 'citat';
    else if (/^( {4}|\t)/.test(l) && !(cur && cur.type === 'liste')) type = (cur && cur.type === 'p') ? 'p' : 'kode';
    else type = (cur && cur.type === 'liste') ? 'liste' : 'p'; // fortsættelseslinje i et listepunkt
    if (type === 'h') { luk(); ud.push({ type, linjer: [l], tekst: l }); continue; }
    if (!cur || cur.type !== type) { luk(); cur = { type, linjer: [] }; }
    cur.linjer.push(l);
  }
  luk();
  return ud;
}

// Synlig tekst: links bliver til deres linktekst, markdown-tegn væk.
export const synlig = (s) => String(s)
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_`]/g, '')
  .replace(/^\s{0,3}(?:[-*+]|\d{1,2}[.)])\s+/gm, '')
  .replace(/^#{1,6}\s+/gm, '');

export const antalOrd = (s) => (synlig(s).match(/[A-Za-z0-9$€£][\w'’.,%$€£/-]*/g) || []).length;

// Forkortelser, hvor punktum ikke afslutter en sætning ("U.S. Army", "e.g. ChatGPT").
// Lære fra den anden blog (6/10): uden dem blev "according to data from the U.S."
// knækket midt i sætningen og fejlmarkeret som uklar kilde.
const FORK = /(?:^|[\s(])(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Inc|Ltd|Co|Corp|vs|etc|e\.g|i\.e|No|Vol|approx|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|U\.S|U\.K|E\.U|U\.N|[A-Z])\.$/;

// Deler en tekst i sætninger uden at ændre et eneste tegn (dele.join(' ') === tekst,
// når teksten kun har enkelte mellemrum mellem sætningerne).
export function saetninger(tekst) {
  const t = String(tekst).replace(/\s*\n\s*/g, ' ').trim();
  const ud = []; let start = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c !== '.' && c !== '!' && c !== '?') continue;
    let k = i + 1; while (k < t.length && /["”’)\]*_]/.test(t[k])) k++;
    if (t[k] !== ' ') continue;
    const naeste = t.slice(k + 1);
    if (!/^["“(\[*_]*[A-Z0-9]/.test(naeste)) continue;
    // Inde i et link: [tekst. Mere](url) — knæk aldrig der.
    const foerTekst = t.slice(start, k);
    if ((foerTekst.match(/\[/g) || []).length > (foerTekst.match(/\]/g) || []).length) continue;
    // Inde i et citat — knæk aldrig der. Prøve #6 (7/10) fik replikken
    // "…is being generated. It should be ready in one or two minutes." delt i to afsnit.
    const indtil = t.slice(0, k);
    if ((indtil.match(/"/g) || []).length % 2 === 1 || (indtil.match(/“/g) || []).length > (indtil.match(/”/g) || []).length) continue;
    if (FORK.test(t.slice(Math.max(start, i - 12), i + 1))) continue;
    ud.push(t.slice(start, k)); start = k + 1; i = k;
  }
  if (start < t.length) ud.push(t.slice(start));
  return ud.filter((s) => s.trim());
}

const prosa = (md) => blokke(md).filter((b) => b.type === 'p');
const prosaOgLister = (md) => blokke(md).filter((b) => b.type === 'p' || b.type === 'liste');
const alleSaetninger = (md) => prosaOgLister(md).flatMap((b) =>
  b.type === 'liste' ? b.linjer.map((l) => l.replace(LISTEPUNKT, '')).flatMap(saetninger) : saetninger(b.tekst));

// Tekst i anførselstegn er et citat — talesprog og "I" er tilladt dér.
const udenCitater = (s) => String(s).replace(/"[^"\n]{0,400}"|“[^”\n]{0,400}”/g, ' ');

// ---------------------------------------------------------------------------
// 2a. Spørgsmålsfilter: er Geminis rettelse af et søgespørgsmål til at stole på?
// ---------------------------------------------------------------------------
// Robotten får spørgsmålet fra Googles autocomplete, og det er ofte en brokke
// ("what is ai content engine"). Gemini foreslår en rettelse; den bruges kun,
// hvis den er en lille rettelse og ikke et nyt spørgsmål.
export function godkendSpoergsmaal(raa, rettet) {
  const r = String(rettet || '').toLowerCase().replace(/[?.!"']+/g, '').replace(/\s+/g, ' ').trim();
  if (!r) return { ok: false, hvorfor: 'tom' };
  if (r === String(raa).toLowerCase().trim()) return { ok: false, hvorfor: 'uændret' };
  const ordR = r.split(' '), ordRaa = String(raa).trim().split(/\s+/);
  if (ordR.length > ordRaa.length + 3) return { ok: false, hvorfor: 'for mange nye ord' };
  if (ordR.length < Math.max(2, ordRaa.length - 3)) return { ok: false, hvorfor: 'for mange ord fjernet' };
  // Bøjninger tæller som samme ord: "hopes" -> "hope" (prøve #4, 7/10: rettelsen
  // "what does search engine optimization hope to increase" blev afvist for "mangler hopes").
  // Samme behandling på begge sider: -ing/-ed væk (lange ord), så endelig s og e.
  const rod = (w) => { let x = w.toLowerCase(); if (x.length > 5) x = x.replace(/(?:ing|ed)$/, ''); return stamme(x.replace(/([^s])s$/, '$1').replace(/e$/, '')); };
  const stammerR = new Set(kerneord(r).map(rod));
  const mangler = kerneord(raa).filter((w) => !stammerR.has(rod(w)));
  if (mangler.length) return { ok: false, hvorfor: `mangler ${mangler.join(', ')}` };
  return { ok: true, spoergsmaal: r };
}

// ---------------------------------------------------------------------------
// 2b. Talesprog fra videoen
// ---------------------------------------------------------------------------
// Transskriptet er tale. Målt 6/10: én udgivet artikel havde videoens egne ord
// ("I'm going to show you"). Citater i anførselstegn er tilladt.
// Målt 6/10 på alle 420 artikler: "subscribe to", "on the screen" og "mine" gav
// kun falske fund (almindeligt sprog), så de er taget ud. "I" efterfulgt af et
// ord med stort er et navn ("Have I Been Pwned"), ikke en fortæller.
const TALE = /\b(?:you guys|hey (?:guys|everyone|folks)|what's up|welcome back|let's (?:dive|jump|get started|take a look|go ahead)|let me (?:show|walk|explain)|i'm going to|i am going to|i'll show|i will show|we're going to|we are going to (?:show|look|walk|cover)|gonna|wanna|gotta|in (?:this|today's|the next|my) (?:video|tutorial|episode|clip)|as you can see|like i said|as i (?:said|mentioned)|(?:click|smash|hit) the (?:like|subscribe|bell|link)|subscribe to (?:my|our|the) channel|link in the description|in the description below|comment below|stay tuned|on my screen|right here on|thanks for watching)\b/i;
const FOERSTE_PERSON = /(?:^|[\s(])(?:I(?! [A-Z])|I'm|I’m|I've|I’ve|I'd|I’d|I'll|I’ll|my|me|myself)(?=[\s,.;:!?)]|$)/;
export function talesprog(md) {
  const fund = [];
  // Citater fjernes på hele blokken FØR den deles i sætninger: et citat på flere
  // sætninger ("... I still don't trust it. And if this keeps going, I ...")
  // ville ellers blive halvt og slippe fri (målt 6/10).
  for (const b of prosaOgLister(md)) {
    const linjer = b.type === 'liste' ? b.linjer.map((l) => l.replace(LISTEPUNKT, '')) : [b.tekst];
    for (const l of linjer) for (const s of saetninger(udenCitater(l.replace(/\s*\n\s*/g, ' ')))) {
      const t = synlig(s);
      const m = t.match(TALE) || t.match(FOERSTE_PERSON);
      if (m) fund.push({ saetning: s.trim(), ord: m[0].trim() });
    }
  }
  return fund;
}

// ---------------------------------------------------------------------------
// 2c. Tekst-diagrammer
// ---------------------------------------------------------------------------
// Målt 6/10: 14 diagrammer tegnet med tegn (pile og kasser) i 8 artikler. De
// stod i ```-blokke og blev vist som rå tekst. Backticks fjernes allerede af
// robotten — så tegningen står tilbage som rodet tekst. Nu fanges selve tegningen.
const KASSE = /[─━│┃┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▶►▼▲◀◄]/;
const PIL_LINJE = /^(?:\s*\S+\s*)?(?:-{2,}>|={2,}>|<-{2,}|→|⟶|↓|↑|⇒)/;
export function tekstDiagram(md) {
  const fund = [];
  for (const b of blokke(md)) {
    if (b.type === 'kode') { fund.push({ type: 'kodeblok', tekst: b.tekst.slice(0, 120) }); continue; }
    if (b.type === 'tabel') continue;
    const kasser = b.linjer.filter((l) => KASSE.test(l));
    const pile = b.linjer.filter((l) => PIL_LINJE.test(l.trim()) || /(?:-{2,}>|={2,}>|→|⟶)\s*$/.test(l.trim()));
    if (kasser.length || pile.length >= 2) fund.push({ type: kasser.length ? 'kassetegn' : 'pile', tekst: b.tekst.slice(0, 120) });
  }
  return fund;
}

// ---------------------------------------------------------------------------
// 2d. Uklare kilder og klistrede søgeord
// ---------------------------------------------------------------------------
// "Experts say", "studies show", "according to reports" — en påstand uden afsender.
// Navngivne kilder er fine ("Gartner analysts estimate", "according to IBM"), og
// "the researchers" peger tilbage på en kilde, der allerede er nævnt.
const KVAL = '(?:many|some|most|leading|recent|industry|security|cybersecurity|tech|technology|market|financial|crypto|independent|various|several|other|top|early)';
const SUBJ = '(?:experts?|researchers?|analysts?|professionals|specialists|studies|research|reports|surveys|statistics|observers|insiders|sources|commentators|critics|proponents)';
const VERB = '(?:say|says|said|note|notes|noted|agree|agrees|warn|warns|suggest|suggests|confirm|confirms|show|shows|indicate|indicates|estimate|estimates|found|have found|point out|points out|believe|believes|argue|argues|point to|points to|predict|predicts|recommend|recommends|caution|cautions|highlight|highlights|stress|stresses|claim|claims)';
const VAG_SUBJ = new RegExp(`\\b(?:${KVAL}\\s+)*${SUBJ}\\s+(?:(?:widely|consistently|often|generally|frequently|now|also|repeatedly)\\s+)?${VERB}\\b`, 'gi');
const VAG_IFLG = new RegExp(`\\baccording to (?:the\\s+)?(?:${KVAL}\\s+)*(?:${SUBJ}|data|metrics|estimates|figures)\\b`, 'gi');
// "reportedly" er IKKE med: målt 6/10 var det 35 af 96 fund, og det er almindeligt
// nyhedssprog om en navngiven aktør ("SpaceX is reportedly seeking ..."), ikke en uklar kilde.
const VAG_FAST = /\b(?:it is (?:widely |often |generally )?(?:said|believed|reported|estimated)|many (?:people|users) (?:say|believe|report)|some say)\b/gi;
export function uklarKilde(saetning) {
  const t = synlig(saetning).replace(/\s+/g, ' ').trim();
  for (const m of t.matchAll(VAG_IFLG)) {
    if (/^\s+(?:from|by|of|at|(?:published|compiled|released|cited|reported|collected|provided|gathered|quoted) by)\s+(?:the\s+)?[A-Z0-9]/.test(t.slice(m.index + m[0].length))) continue;
    return m[0];
  }
  for (const m of t.matchAll(VAG_SUBJ)) {
    const ord2 = t.slice(0, m.index).trim().split(' ').slice(-2);
    const foer = ord2[ord2.length - 1] || '';
    if (ord2.some((w) => /(['’]s|s['’])$/i.test(w))) continue;                       // "Google's researchers"
    if (/^(the|these|those|its|their|his|her|our|whose|both|two|three)$/i.test(foer)) continue; // peger tilbage
    if (/^[A-Z0-9][\w&.'’-]*$/.test(foer) && !/[.!?:;]$/.test(foer) && m.index > 0) continue;  // "IBM researchers"
    return m[0];
  }
  const f = t.match(VAG_FAST);
  return f ? f[0] : null;
}
export function uklareKilder(md, faqSvar = []) {
  const ud = [];
  for (const s of [...alleSaetninger(md), ...faqSvar.flatMap(saetninger)]) { const k = uklarKilde(s); if (k) ud.push({ saetning: s.trim(), ord: k }); }
  return ud;
}

// Søgeordet klistret ind i en sætning: "Understanding what is canva text to video".
// Kun søgeord med omvendt ordstilling (what is / how does / is / can ...) er
// forkerte inde i en sætning; et citeret eksempel og et spørgsmål med "?" er fine.
const OMVENDT = /^(?:(?:what|how|which|when|where|who|why)\s+(?:is|are|does|do|did|can|should|will)|is|are|can|does|do|did|should|will)\b/i;
export function klistretSoegeord(md, spoergsmaal) {
  const q = String(spoergsmaal || '').toLowerCase().replace(/[?.!]+$/, '').replace(/\s+/g, ' ').trim();
  if (!q || !OMVENDT.test(q)) return [];
  const ud = [];
  for (const s of alleSaetninger(md)) {
    const t = synlig(s).replace(/\s+/g, ' ').trim();
    const i = t.toLowerCase().indexOf(q);
    if (i <= 0 || /["“'‘]/.test(t[i - 1])) continue;
    // Et spørgsmål er kun i orden, når søgeordet selv er spørgsmålet ("So what is X?").
    // "Wondering what is X?" er stadig klistret (målt 7/10 i prøveartikel #3's META).
    if (t.includes('?') && /^(?:so|but|and|then|now|well|okay|ok)[,\s]*$/i.test(t.slice(0, i))) continue;
    ud.push({ saetning: s.trim(), ord: q });
  }
  return ud;
}

// Ordret fra videoen (merværdi, 8/10): en sætning, der deler ORDRET_N ord i træk med
// transskriptet, er afskrift, ikke en artikel. Tekst i anførselstegn er et citat og
// tæller ikke - et citat med navn er tilladt. Ord sammenlignes uden tegnsætning og
// store bogstaver, så "It's" og "it s" er ens på begge sider.
export const ORDRET_N = 8;
const normOrd = (s) => String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
// udenCitater er defineret længere oppe (bruges også af talesprog).
export function ordretFraKilde(md, transskript, n = ORDRET_N) {
  const t = normOrd(transskript);
  const kilde = new Set();
  for (let i = 0; i + n <= t.length; i++) kilde.add(t.slice(i, i + n).join(' '));
  const ud = [];
  if (!kilde.size) return ud;
  for (const s of alleSaetninger(md)) {
    const w = normOrd(udenCitater(synlig(s)));
    for (let i = 0; i + n <= w.length; i++) {
      const g = w.slice(i, i + n).join(' ');
      if (kilde.has(g)) { ud.push({ saetning: s.trim(), ord: g }); break; }
    }
  }
  return ud;
}
// Andel af brødtekstens sætninger, der er afskrift (0-1).
export function ordretAndel(md, transskript, n = ORDRET_N) {
  const alle = alleSaetninger(md).length;
  return alle ? ordretFraKilde(md, transskript, n).length / alle : 0;
}

// ---------------------------------------------------------------------------
// 2e. Første afsnit: et kort, direkte svar
// ---------------------------------------------------------------------------
export const FOERSTE_MAKS_ORD = 60;
export const FOERSTE_MAKS_SAETNINGER = 3;
export function foersteAfsnit(md) {
  const b = blokke(md).find((x) => x.type !== 'h');
  if (!b || b.type !== 'p') return { tekst: '', ord: 0, saetninger: 0, ok: false };
  const n = antalOrd(b.tekst), s = saetninger(b.tekst).length;
  return { tekst: b.tekst, ord: n, saetninger: s, ok: n <= FOERSTE_MAKS_ORD && s <= FOERSTE_MAKS_SAETNINGER };
}
// Deler et for langt første afsnit efter 2. sætning (eller 1., hvis to allerede
// er for meget). Ingen ord ændres — kun et linjeskift flyttes.
export function delFoersteAfsnit(md) {
  const fa = foersteAfsnit(md);
  if (!fa.tekst || fa.ok) return { md, delt: false };
  const s = saetninger(fa.tekst);
  if (s.length < 2) return { md, delt: false };
  let n = antalOrd(s[0]) + antalOrd(s[1]) <= FOERSTE_MAKS_ORD ? 2 : 1;
  if (n >= s.length) n = s.length - 1;
  const ny = `${s.slice(0, n).join(' ')}\n\n${s.slice(n).join(' ')}`;
  const krop = brodtekst(md), fm = String(md).replace(/\r\n/g, '\n').slice(0, String(md).replace(/\r\n/g, '\n').length - krop.length);
  const i = krop.indexOf(fa.tekst);
  if (i < 0) return { md, delt: false };
  return { md: fm + krop.slice(0, i) + ny + krop.slice(i + fa.tekst.length), delt: true };
}

// ---------------------------------------------------------------------------
// 2f. Lister
// ---------------------------------------------------------------------------
export const MIN_LISTER = 2;
export function lister(md) {
  return blokke(md).filter((b) => b.type === 'liste' && b.linjer.filter((l) => LISTEPUNKT.test(l)).length >= 2);
}

// ---------------------------------------------------------------------------
// 2g. Korte afsnit
// ---------------------------------------------------------------------------
// Et afsnit er for langt, når det har over 3 sætninger, 3 sætninger over 60 ord
// eller 2 sætninger over 75 ord. Grænserne er valgt ud fra målingen på alle
// techfeedwatch-artikler 6/10 (_maal-skriveregler.mjs) — se statusfilen.
export const AFSNIT = { maksSaetninger: 3, maksOrdTre: 60, maksOrdTo: 75 };
export function forLangtAfsnit(tekst, r = AFSNIT) {
  const n = saetninger(tekst).length, w = antalOrd(tekst);
  return n > r.maksSaetninger || (n === r.maksSaetninger && w > r.maksOrdTre) || (n === 2 && w > r.maksOrdTo);
}
// Grupperer sætninger i så FÅ bidder som muligt, der hver holder reglen, og
// blandt dem den deling med færrest afsnit på én sætning og jævnest længde.
// Første udgave delte grådigt fra starten: 4 sætninger blev til 3+1, og
// prøveartikel #3 (7/10) fik 8 af 29 afsnit på én sætning. Nu bliver det 2+2.
const holder = (g, r) => { const n = g.length, w = antalOrd(g.join(' ')); return n === 1 || (n <= r.maksSaetninger && !(n === r.maksSaetninger && w > r.maksOrdTre) && !(n === 2 && w > r.maksOrdTo)); };
function delinger(n, g) {
  // alle måder at dele n sætninger i g sammenhængende bidder (n er lille: et afsnit)
  if (g === 1) return [[n]];
  const ud = [];
  for (let k = 1; k <= n - g + 1; k++) for (const rest of delinger(n - k, g - 1)) ud.push([k, ...rest]);
  return ud;
}
function grupper(s, r) {
  if (s.length > 12) { // usædvanligt langt afsnit: grådig deling er godt nok og hurtig
    const grp = []; let cur = [];
    for (const x of s) { if (cur.length && !holder([...cur, x], r)) { grp.push(cur); cur = []; } cur.push(x); }
    if (cur.length) grp.push(cur);
    return grp;
  }
  for (let g = 2; g <= s.length; g++) {
    let bedst = null, bedstScore = null;
    for (const d of delinger(s.length, g)) {
      let i = 0; const grp = d.map((k) => s.slice(i, (i += k)));
      if (!grp.every((x) => holder(x, r))) continue;
      const ord = grp.map((x) => antalOrd(x.join(' ')));
      const score = [grp.filter((x) => x.length === 1).length, Math.max(...ord) - Math.min(...ord)];
      if (!bedstScore || score[0] < bedstScore[0] || (score[0] === bedstScore[0] && score[1] < bedstScore[1])) { bedst = grp; bedstScore = score; }
    }
    if (bedst) return bedst;
  }
  return s.map((x) => [x]);
}
// Deler for lange afsnit MELLEM sætninger. Ingen ord ændres. Første afsnit
// håndteres af delFoersteAfsnit. Returnerer også, hvor mange afsnit der nu er
// én sætning — så loggen viser, om teksten er blevet hakket.
export function delLangeAfsnit(md, r = AFSNIT) {
  const krop = brodtekst(md), norm = String(md).replace(/\r\n/g, '\n');
  const fm = norm.slice(0, norm.length - krop.length);
  let ud = krop, delt = 0, foerste = true;
  for (const b of blokke(krop)) {
    if (b.type === 'h') continue;
    if (foerste) { foerste = false; continue; }
    if (b.type !== 'p' || !forLangtAfsnit(b.tekst, r)) continue;
    const s = saetninger(b.tekst);
    if (s.length < 2) continue;
    const grp = grupper(s, r);
    if (grp.length < 2) continue;
    const ny = grp.map((g) => g.join(' ')).join('\n\n');
    const i = ud.indexOf(b.tekst);
    if (i < 0) continue;
    ud = ud.slice(0, i) + ny + ud.slice(i + b.tekst.length);
    delt++;
  }
  return { md: fm + ud, delt };
}
export function afsnitsTal(md) {
  const p = prosa(md);
  const en = p.filter((b) => saetninger(b.tekst).length === 1).length;
  return { afsnit: p.length, enSaetning: en, forLange: p.slice(1).filter((b) => forLangtAfsnit(b.tekst)).length, maksOrd: Math.max(0, ...p.map((b) => antalOrd(b.tekst))) };
}

// ---------------------------------------------------------------------------
// 2h. Fyld: sætninger, man intet lærer af
// ---------------------------------------------------------------------------
// Gemini udpeger dem (add-video.mjs); her afgøres, hvilke der MÅ fjernes, og
// de fjernes uden at noget omskrives. Aldrig første afsnit, lister, sætninger
// med tal, links eller kolon til sidst, og aldrig et afsnits eneste sætning.
export function fyldKandidater(md) {
  const ud = [];
  prosa(md).slice(1).forEach((b) => {
    for (const s of saetninger(b.tekst)) {
      if (/\d|\]\(|:\s*$/.test(s) || antalOrd(s) < 5 || ud.includes(s)) continue;
      ud.push(s);
    }
  });
  return ud;
}
export function fjernSaetninger(md, liste, maks) {
  const krop = brodtekst(md), norm = String(md).replace(/\r\n/g, '\n');
  const fm = norm.slice(0, norm.length - krop.length);
  const tilladt = new Set(fyldKandidater(md));
  let ud = krop, fjernet = 0; const fjernede = [];
  for (const b of prosa(krop).slice(1)) {
    const dele = saetninger(b.tekst);
    if (dele.length < 2) continue;
    const behold = [];
    dele.forEach((s, j) => {
      // Peger næste sætning tilbage på denne ("However, that only happens …"), må den
      // ikke fjernes. Første live-artikel med reglerne (7/10) mistede "Programming can
      // certainly make you rich." og stod tilbage med et hængende "However, that …".
      const naeste = dele[j + 1] || '';
      const peger = /^["“(]*(?:However|But|That|This|These|Those|It|Its|They|Their|So|Yet|Still|Instead|Even so|Therefore|Thus|As a result|Such|In turn|Otherwise|Then|Also|And)\b/.test(naeste);
      if (!peger && fjernet < maks && liste.includes(s) && tilladt.has(s) && behold.length + (dele.length - j - 1) >= 1) { fjernet++; fjernede.push(s); }
      else behold.push(s);
    });
    if (behold.length === dele.length) continue;
    const i = ud.indexOf(b.tekst);
    if (i >= 0) ud = ud.slice(0, i) + behold.join(' ') + ud.slice(i + b.tekst.length);
  }
  return { md: fm + ud, fjernet, fjernede };
}
