// Sammenhæng efter faktatjekket (5/11-2026, Jacob: "det skal rettes").
//
// Målt 5/11: slutkontrollen retter eller sletter en forkert sætning, men skriver ikke afsnittet
// sammen igen. 7 artikler fik ødelagte tabeller (en hel sætning i én celle), halve FAQ-svar og
// sætninger, der henviser til noget, der er væk ("It achieves this ..."). Her:
//   1. retTabeller: tabeller repareres uden AI - en række med forkert antal celler, tomme celler
//      eller en hel sætning i en celle tages ud; er der under 2 rækker tilbage, fjernes tabellen
//      og dens indledning ("The following ... :").
//   2. rydLinjer: linjer med kun mellemrum og mellemrum for enden af linjer (rester efter et klip).
//   3. reparer: de afsnit og FAQ-svar, kontrollen rørte, skrives sammen af modellen. Den må ikke
//      tilføje tal, navne eller links - KODEN kontrollerer det, og holder et svar ikke, bruges det ikke.
import { talMaengde } from './faktatjek.mjs';

// Læser modellens JSON-liste. 6/11-2026: svaret havde rå linjeskift inde i en tekststreng ("Bad control
// character"), JSON.parse fejlede, og hele artiklen blev stående urørt. Nu escapes de, før der gives op.
export function lasJsonListe(tekst) {
  const raa = (String(tekst || '').match(/\[[\s\S]*\]/) || ['[]'])[0];
  try { return JSON.parse(raa); } catch { /* prøv at reparere nedenfor */ }
  let ud = '', iStreng = false, escaped = false;
  for (const c of raa) {
    if (iStreng && !escaped && c === '\n') { ud += '\\n'; continue; }
    if (iStreng && !escaped && c === '\r') continue;
    if (iStreng && !escaped && c === '\t') { ud += '\\t'; continue; }
    if (c === '"' && !escaped) iStreng = !iStreng;
    escaped = c === '\\' && !escaped;
    ud += c;
  }
  try { return JSON.parse(ud); } catch { return []; }
}

const erTabelLinje = (l) => /^\s*\|/.test(l);
const celler = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
const erSkille = (l) => /^[\s|:-]+$/.test(l) && /-{2,}/.test(l);
const ordTal = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;

export function retTabeller(md) {
  const linjer = String(md).split('\n');
  const ud = [];
  let rettet = 0;
  for (let i = 0; i < linjer.length;) {
    if (!erTabelLinje(linjer[i])) { ud.push(linjer[i]); i++; continue; }
    const blok = [];
    while (i < linjer.length && erTabelLinje(linjer[i])) blok.push(linjer[i++]);
    const n = celler(blok[0]).length;
    const skille = blok.findIndex(erSkille);
    const top = blok.slice(0, skille >= 0 ? skille + 1 : 1);
    const data = blok.slice(top.length);
    // God række: rigtigt antal celler, første celle (rækkens navn) udfyldt, mindst én celle mere udfyldt, ingen celle over 25 ord.
    const gode = data.filter((l) => { const c = celler(l); return c.length === n && c[0].trim() && (n < 2 || c.slice(1).some((x) => x.trim())) && c.every((x) => ordTal(x) <= 25); });
    // En tabel med under 2 rækker er ingen sammenligning (5/11: opstår, når faktatjekket fjerner en række).
    if (gode.length === data.length && gode.length >= 2) { ud.push(...blok); continue; }
    rettet++;
    if (gode.length >= 2) { ud.push(...top, ...gode); continue; }
    // For lidt tilbage til en tabel: den og dens indledende linje (slutter med kolon) fjernes.
    while (ud.length && !ud[ud.length - 1].trim()) ud.pop();
    if (ud.length && /:\s*$/.test(ud[ud.length - 1]) && !/^\s*#/.test(ud[ud.length - 1])) ud.pop();
    ud.push('');
  }
  return { md: ud.join('\n').replace(/\n{3,}/g, '\n\n'), rettet };
}

export function rydLinjer(md) {
  return String(md).split('\n').map((l) => (erTabelLinje(l) ? l : l.replace(/[ \t]+$/, '').replace(/^[ \t]+(?=[A-Z0-9"(])/, ''))).join('\n').replace(/\n{3,}/g, '\n\n');
}

// ---------- Hvilke afsnit rørte kontrollen? ----------
const SOURCES = /\n## Sources\s*\n/;
const afsnit = (md) => String(md || '').split(SOURCES)[0].split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
const ordAf = (t) => String(t || '').toLowerCase().match(/[a-z0-9$%]+/g) || [];
const andel = (a, b) => { const B = new Set(ordAf(b)); const A = ordAf(a); return A.length ? A.filter((w) => B.has(w)).length / A.length : 0; };
const kanRepareres = (a) => !/^#/.test(a) && !erTabelLinje(a) && !/^(```|!\[|<)/.test(a);

// Returnerer [{ efter, foer }]: afsnit, der er ændret, og afsnit lige efter et afsnit, der er væk
// (de kan starte med "This ..." om noget, læseren ikke længere ser).
export function aendredeAfsnit(foerMd, efterMd) {
  const foer = afsnit(foerMd), efter = afsnit(efterMd);
  const efterSet = new Set(efter), foerSet = new Set(foer);
  const ud = new Map();
  for (const a of efter) {
    if (foerSet.has(a) || !kanRepareres(a)) continue;
    let bedst = '', b = 0;
    for (const f of foer) { const x = andel(a, f); if (x > b) { b = x; bedst = f; } }
    ud.set(a, b >= 0.4 ? bedst : '');
  }
  for (let i = 0; i < foer.length; i++) {
    if (efterSet.has(foer[i]) || efter.some((e) => andel(foer[i], e) >= 0.5)) continue;
    const naeste = foer.slice(i + 1).find((f) => efterSet.has(f));
    if (naeste && kanRepareres(naeste) && !ud.has(naeste) && !/^#/.test(foer[i])) ud.set(naeste, `${foer[i]}\n\n${naeste}`);
  }
  const forrige = (a) => { const i = efter.indexOf(a); return i > 0 ? efter[i - 1] : ''; };
  return [...ud].map(([e, foer]) => ({ efter: e, foer, kontekst: forrige(e) }));
}

// ---------- Kontrol af et repareret afsnit (koden, ikke modellen) ----------
const LINK = /\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g;
const STARTORD = new Set(['the', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their', 'a', 'an', 'in', 'on', 'for', 'and', 'but', 'so', 'as', 'when', 'while', 'if', 'because', 'however', 'instead', 'still', 'yet', 'also', 'both', 'each', 'every', 'many', 'most', 'some', 'today', 'there', 'here', 'what', 'why', 'how', 'with', 'without', 'by', 'to', 'at', 'from', 'after', 'before', 'once', 'since', 'unlike', 'like', 'even', 'only', 'one', 'i', 'my', 'you', 'your', 'we', 'our']);
export function holder(redigeret, ny) {
  const r = String(redigeret), n = String(ny || '').trim();
  if (!n) return 'tomt svar';
  if (/^#|\n#/.test(n) || erTabelLinje(n)) return 'overskrift eller tabel i svaret';
  const talR = talMaengde(r);
  const nyeTal = [...talMaengde(n)].filter((t) => !talR.has(t));
  if (nyeTal.length) return `nye tal: ${nyeTal.join(', ')}`;
  const linksR = new Set([...r.matchAll(LINK)].map((m) => m[1]));
  const nyeLinks = [...n.matchAll(LINK)].map((m) => m[1]).filter((u) => !linksR.has(u));
  if (nyeLinks.length) return `nye links: ${nyeLinks.join(', ')}`;
  const rLav = r.toLowerCase();
  // Navne = ord med stort begyndelsesbogstav, der ikke står først i en sætning.
  const midtOrd = n.replace(LINK, ']').split(/(?<=[.!?:])\s+|\n/).flatMap((s) => s.replace(/^[\s*-]*/, '').split(/\s+/).slice(1));
  const nyeNavne = [...new Set(midtOrd.map((w) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')).filter((w) => /^[A-Z]/.test(w) && !rLav.includes(w.toLowerCase().replace(/['’]s$/, '')) && !STARTORD.has(w.toLowerCase())))];
  if (nyeNavne.length) return `nye navne: ${nyeNavne.join(', ')}`;
  if (/^\s*-\s/.test(r) !== /^\s*-\s/.test(n)) return 'listeform ændret';
  // Et afsnit, der slutter med kolon, indleder en liste eller tabel lige efter (målt 5/11: bitcoin-artiklen).
  if (/:\s*$/.test(r) && !/:\s*$/.test(n)) return 'indledning til liste fjernet';
  if (ordTal(n) > ordTal(r) + 12) return 'for langt';
  if (ordTal(r) >= 15 && ordTal(n) < ordTal(r) * 0.4) return 'for meget fjernet';
  return '';
}

function prompt(dele) {
  return `A fact-checker has just edited a published article: wrong sentences were removed or replaced. Each numbered item shows BEFORE (the text before the check) and AFTER (the text now). The removed and replaced claims are wrong and must stay out.

Rewrite AFTER so it reads naturally on its own:
- fix sentences that now point to something that is gone ("it", "this", "they", "the target", "this occurs because"), by naming what they mean, using only words that are in AFTER, or by removing that sentence
- remove a sentence that no longer makes sense without the removed text
- fix broken grammar and joins
- a FAQ answer must start by answering the question directly

STRICT RULES:
- Do NOT add any fact, number, date, name, source or link that is not already in AFTER. Nothing from BEFORE that is missing in AFTER may come back.
- Keep every markdown link from AFTER exactly as written, unless you remove the whole sentence it is in.
- Keep the plain, direct style. No new phrases like "it is important to note". Same language, similar length or shorter.
- If AFTER already reads well, return it unchanged. Words like "this" or "it" are fine when CONTEXT or AFTER itself says what they mean.
- Never remove or change a sentence just to improve style - only fix what the edit broke.

Return ONLY a JSON array: [{"n":1,"tekst":"..."}]

${dele.map((d, i) => `### ${i + 1}${d.spoergsmaal ? ` (FAQ answer to: "${d.spoergsmaal}")` : ''}${d.kontekst ? `\nCONTEXT (the text just before it - for reference only, do not return it):\n${d.kontekst}\n` : ''}\nBEFORE:\n${d.foer || '(not available)'}\n\nAFTER:\n${d.efter}`).join('\n\n')}`;
}

// Ét modelkald for alle dele. Returnerer pr. del: den nye tekst, '' (uændret) eller null (afvist af koden).
export async function skrivSammen(genAI, hentModel, model, dele, log = console.log) {
  if (!dele.length) return [];
  let svar = [];
  try {
    // Lav tænkning: målt 5/11 brugte høj tænkning 7.862 af 8.192 tokens og nåede ikke at svare.
    const r = await hentModel(genAI, { model, generationConfig: { temperature: 0, maxOutputTokens: 16384, responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } } }).generateContent(prompt(dele));
    svar = lasJsonListe(r.response.text());
  } catch (e) { log(`   ⚠️ sammenhæng: intet svar (${String(e.message).split('\n')[0].slice(0, 120)}) - teksten står som efter kontrollen`); return dele.map(() => ''); }
  return dele.map((d, i) => {
    const ny = String((Array.isArray(svar) ? svar : []).find((y) => y && y.n === i + 1)?.tekst || '').trim();
    if (!ny || ny === d.efter) return '';
    const grund = holder(d.efter, ny);
    if (grund) { log(`   ✗ sammenhæng afvist (${grund}): ${d.efter.slice(0, 90)}`); return null; }
    log(`   ✓ sammenhæng: ${d.efter.slice(0, 70)} → ${ny.slice(0, 70)}`);
    return ny;
  });
}
// f = slutkontrollens felter (ændres på stedet), foer = en kopi af felterne fra før kontrollen.
export async function reparer(genAI, hentModel, model, f, foer, log = console.log) {
  const rap = { tabeller: 0, afsnit: 0, faq: 0, afvist: 0 };
  const t = retTabeller(f.brodtekst);
  f.brodtekst = rydLinjer(t.md); rap.tabeller = t.rettet;
  const dele = aendredeAfsnit(foer.brodtekst, f.brodtekst).map((x) => ({ ...x, felt: 'brod' }));
  const gamleSvar = new Map((foer.faqs || []).map((q) => [q.question, q.answer]));
  for (const q of f.faqs || []) if (gamleSvar.has(q.question) && gamleSvar.get(q.question) !== q.answer) dele.push({ felt: 'faq', q, spoergsmaal: q.question, foer: gamleSvar.get(q.question), efter: q.answer });
  if (!dele.length) return rap;
  const nye = await skrivSammen(genAI, hentModel, model, dele, log);
  dele.forEach((d, i) => {
    const ny = nye[i];
    if (ny === null) { rap.afvist++; return; }
    if (!ny || ny === d.efter) return;
    if (d.felt === 'faq') { d.q.answer = ny.replace(/\s+/g, ' '); rap.faq++; }
    else { const k = f.brodtekst.indexOf(d.efter); if (k < 0) return; f.brodtekst = f.brodtekst.slice(0, k) + ny + f.brodtekst.slice(k + d.efter.length); rap.afsnit++; }
  });
  f.brodtekst = rydLinjer(f.brodtekst);
  return rap;
}

// ---------- Vagt: det, der stadig er galt i en færdig artikel ----------
export function skaderIArtikel(md) {
  const ud = [];
  const t = retTabeller(md);
  if (t.rettet) ud.push(`${t.rettet} ødelagt(e) tabel(ler)`);
  const huller = String(md).split('\n').filter((l) => l.length && !l.trim()).length;
  if (huller) ud.push(`${huller} linje(r) med kun mellemrum`);
  return ud;
}
