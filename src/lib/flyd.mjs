// Naturligt sprog (5/11-2026, Jacob: "alt AI-sprog skal fjernes ... det skal flyde så naturligt som muligt").
//
// Målt 5/11 på de 20 nyeste artikler: "According to ..."/"reports that" 213 gange (op til 24 i én artikel,
// "NextGen Humanoids reports" 10 gange i ét afsnit), samme pointe to gange i træk, og vendinger som
// "Why this matters for your setup:". Skrivereglerne kræver en navngiven kilde ved hvert faktum, og
// modellen gør det mekanisk.
//
// Her skriver en redaktør hver sektion om, så den flyder: kilden nævnes, hvor dens fakta begynder, og
// derefter flyder teksten; gentagelser og AI-vendinger forsvinder. KODEN afviser en sektion, hvis:
//   - et tal er kommet til eller forsvundet, et link eller en tabel er ændret, en overskrift er rørt
//   - et nyt navn er kommet til
//   - en sætning med et tal har mistet sin kilde (så faktatjekket stadig kan binde tallet til kilden)
//   - længden eller sætningslængden ændrer sig for meget
// Afvises en sektion, bruges den gamle. Kører FØR slutkontrollen, så den endelige tekst faktatjekkes.
import { talMaengde } from './faktatjek.mjs';
import { lasJsonListe } from './sammenhaeng.mjs';

const SOURCES = /\n## Sources\s*\n/;
const LINK_FULD = /\[[^\]]*\]\((?:[^()\s]|\([^()\s]*\))+\)/g;
const ordTal = (t) => String(t || '').replace(LINK_FULD, (m) => m.replace(/\]\(.*$/, '')).split(/\s+/).filter(Boolean).length;
const saetninger = (t) => String(t || '').replace(/\n(?=\s*[-*|])/g, '\n\n').split(/(?<=[.!?])\s+|\n\s*\n/).map((s) => s.trim()).filter((s) => s && !/^\|/.test(s));
const tabelLinjer = (t) => String(t).split('\n').filter((l) => /^\s*\|/.test(l)).join('\n');
const linksAf = (t) => (String(t).match(LINK_FULD) || []).sort().join('\n');
const snitLaengde = (t) => { const s = saetninger(t).filter((x) => !/^[-*]\s/.test(x)); return s.length ? s.reduce((a, x) => a + ordTal(x), 0) / s.length : 0; };
// Ingen nye tal. Et tal må kun forsvinde, hvis det allerede står i en tidligere sektion (6/11: Claude-artiklen
// gentog "200,000 tokens ... 64 %" under "begrænsninger" - den gentagelse skal kunne fjernes).
const sammeTal = (a, b, tidligere = '') => { const A = talMaengde(a), B = talMaengde(b), T = talMaengde(tidligere); return [...B].every((x) => A.has(x)) && [...A].every((x) => B.has(x) || T.has(x)); };
const harNavn = (s, navne) => navne.some((n) => n && n.length > 2 && s.includes(n));
// Et tal skal have sin kilde i samme sætning ELLER i sætningen lige før i samme afsnit (5/11: med krav om samme
// sætning blev "According to" stående - 7,5 pr. 1.000 ord mod techmediaarchs 3,1).
const talSaetningerUdenKilde = (t, navne) => String(t || '').split(/\n\s*\n/).reduce((sum, afsnit) => {
  const ss = saetninger(afsnit);
  return sum + ss.filter((s, i) => [...talMaengde(s)].some((x) => !/^(19|20)\d\d$/.test(x)) && !harNavn(s, navne) && !(i > 0 && harNavn(ss[i - 1], navne))).length;
}, 0);
const antalAccording = (t) => (String(t).match(/\baccording to\b/gi) || []).length;

export function holderSektion(gammel, ny, navne = [], tidligere = '') {
  const g = String(gammel), n = String(ny || '').trim();
  if (!n) return 'tomt svar';
  if (/(^|\n)#{1,6}\s/.test(n)) return 'overskrift i svaret';
  if (tabelLinjer(g) !== tabelLinjer(n)) return 'tabel ændret';
  if (linksAf(g) !== linksAf(n)) return 'links ændret';
  if (!sammeTal(g, n, tidligere)) return 'tal ændret';
  const gLav = g.toLowerCase();
  const midt = n.replace(LINK_FULD, ' ').split(/(?<=[.!?:])\s+|\n/).flatMap((s) => s.replace(/^[\s*-]*/, '').split(/\s+/).slice(1));
  const nyeNavne = [...new Set(midt.map((w) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')).filter((w) => /^[A-Z]/.test(w) && !gLav.includes(w.toLowerCase().replace(/['’]s$/, ''))))];
  if (nyeNavne.length) return `nye navne: ${nyeNavne.slice(0, 5).join(', ')}`;
  if (talSaetningerUdenKilde(n, navne) > talSaetningerUdenKilde(g, navne)) return 'et tal har mistet sin kilde';
  const lg = ordTal(g), ln = ordTal(n);
  if (ln > lg * 1.05 + 5) return `for langt (${ln} mod ${lg} ord)`;
  // 72 %: målt 5/11 blev sektioner 21-29 % kortere, når gentagelser røg ud. Tal og navne er låst ovenfor.
  if (ln < lg * 0.72) return `for meget fjernet (${ln} mod ${lg} ord)`;
  // 17,5 ord i snit pr. sektion: stadig 9.-10. klasse (robottens stop er 18, faktatjek.mjs ORD_STOP). Målt 5/11:
  // originalerne lå på 15 ord, og med grænsen 16 blev næsten al sammenskrivning afvist.
  if (snitLaengde(n) > Math.max(17.5, snitLaengde(g) + 1)) return `længere sætninger (${snitLaengde(n).toFixed(1)} mod ${snitLaengde(g).toFixed(1)} ord)`;
  if (antalAccording(n) > Math.max(1, Math.min(antalAccording(g), 2))) return `for mange "according to" (${antalAccording(n)})`;
  // 5/11: "According to X" blev byttet til "X notes that" (gaming-artiklen 3 -> 7). Faste kildevendinger i alt må ikke stige.
  const faste = (t) => (String(t).match(/\baccording to\b|\b(reports|notes|states|explains|highlights|emphasizes|points out) that\b/gi) || []).length;
  if (faste(n) > faste(g)) return `flere faste kildevendinger (${faste(n)} mod ${faste(g)})`;
  const iPerson = (t) => (t.match(/\b(I|I'm|I've|my|me)\b/g) || []).length;
  if (iPerson(n) !== iPerson(g)) return 'første person ændret';
  return '';
}

function prompt(dele, spoergsmaal) {
  return `You are the senior editor of a plain-English tech site. The article answers "${spoergsmaal}". Below are its sections (body text only). Rewrite each so it reads like a knowledgeable person explaining things to a friend - natural, flowing, human - while keeping every fact exactly.

WHAT TO FIX
- Mechanical attribution. Name a source where its facts begin, then let the text flow. Do not start sentence after sentence with "According to X", "X reports that", "X notes that", "X states that". Vary it naturally ("Intel's tests found ...", "In Cisco's words ...", "The same report adds ..."), and say it plainly without a source phrase when the sentence before already made the source clear. Use the words "according to" AT MOST ONCE per section, and do not just swap it for another fixed formula ("X notes that", "X states that", "X highlights that", "X emphasizes that") - most sentences need no source phrase at all. A sentence with a number must name its source itself or directly follow a sentence in the same paragraph that names it.
- Repetition: when a sentence restates the one before, merge them or drop the repeat. When a section repeats facts an EARLIER section already gave, drop the repeat (a later section may only refer back briefly).
- Choppy paragraphs: join one-sentence paragraphs that belong together into paragraphs of 2-4 sentences.
- AI-sounding phrasing: labels like "Why this matters for your setup:", "Here's the thing", "In today's world", "It's worth noting", "plays a crucial role", "key takeaway", "game-changer", "seamless", "robust", "landscape", "unlock", "harness", "elevate", "navigate", "delve"; empty wrap-up sentences; stiff connectors ("Additionally,", "Furthermore,", "Moreover,", "Conversely,") at the start of many sentences.
- Choppy runs of very short sentences that belong together: join a few with "and", "but", "so", "because" - but keep sentences short: aim for 14-16 words on average, never above 17, for readers at a 9th-10th grade level. Join only where it truly helps the flow.
- A term explained in brackets "(...)" should be explained only the first time.

STRICT RULES
- Keep every fact, number, date, name and claim (only a fact repeated from an earlier section may be dropped). Add nothing - no new facts, names, examples or opinions.
- Keep every markdown link exactly as written, character for character: same link text, same address. Keep tables exactly as they are.
- Keep lists as lists (you may tidy the wording of an item). Do not add headings.
- Paragraphs written in the first person ("I", "my") are the site owner's own words: keep them exactly as they are.
- Keep the length about the same or a little shorter.

Return ONLY a JSON array: [{"n":1,"tekst":"<the rewritten section body in markdown>"}]

${dele.map((d, i) => `### SECTION ${i + 1}${d.overskrift ? ` - "${d.overskrift}"` : ' (introduction)'}\n${d.tekst}`).join('\n\n')}`;
}

// Deler brødteksten (uden kildeliste) i sektioner ved ## overskrifter.
function sektioner(md) {
  const [krop, ...rest] = String(md).split(SOURCES);
  const dele = [];
  const re = /^##\s+(.+)$/gm;
  let sidst = 0, overskrift = '', m;
  while ((m = re.exec(krop))) { dele.push({ overskrift, start: sidst, slut: m.index }); overskrift = m[1].trim(); sidst = m.index + m[0].length; }
  dele.push({ overskrift, start: sidst, slut: krop.length });
  return { krop, kilder: rest.length ? `\n## Sources\n${rest.join('\n## Sources\n')}` : '', dele: dele.map((d) => ({ ...d, tekst: krop.slice(d.start, d.slut).trim() })) };
}

// Returnerer { md, rap }. Fejl i kaldet = artiklen uændret.
export async function flydende(genAI, hentModel, model, md, { spoergsmaal = '', navne = [], log = console.log } = {}) {
  const s = sektioner(md);
  const kand = s.dele.map((d, i) => ({ ...d, i })).filter((d) => ordTal(d.tekst) >= 25);
  const rap = { sektioner: kand.length, omskrevet: 0, afvist: 0, accordingFoer: (md.match(/\baccording to\b/gi) || []).length, accordingEfter: 0 };
  if (!kand.length) return { md, rap };
  let svar = [];
  try {
    // responseMimeType: modellen svarer i rent JSON (6/11: rå linjeskift i strengen gjorde svaret ulæseligt).
    const r = await hentModel(genAI, { model, generationConfig: { temperature: 0.4, maxOutputTokens: 32768, responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } } }).generateContent(prompt(kand, spoergsmaal));
    svar = lasJsonListe(r.response.text());
  } catch (e) { log(`   ⚠️ naturligt sprog: intet svar (${String(e.message).split('\n')[0].slice(0, 120)}) - teksten uændret`); rap.accordingEfter = rap.accordingFoer; return { md, rap }; }
  let krop = s.krop;
  // Bagfra, så positionerne passer
  for (const d of [...kand].reverse()) {
    const ny = String((Array.isArray(svar) ? svar : []).find((y) => y && y.n === kand.indexOf(d) + 1)?.tekst || '').trim();
    if (!ny || ny === d.tekst) continue;
    const tidligere = s.dele.slice(0, d.i).map((x) => x.tekst).join('\n\n');
    const grund = holderSektion(d.tekst, ny, navne, tidligere);
    if (grund) { rap.afvist++; log(`   ✗ naturligt sprog afvist (${grund}): ${d.overskrift.slice(0, 60) || 'indledning'}`); continue; }
    const gammelDel = krop.slice(d.start, d.slut);
    const foran = gammelDel.match(/^\s*/)[0], bagved = gammelDel.match(/\s*$/)[0];
    krop = krop.slice(0, d.start) + foran + ny + bagved + krop.slice(d.slut);
    rap.omskrevet++;
  }
  const ud = krop + s.kilder;
  rap.accordingEfter = (ud.match(/\baccording to\b/gi) || []).length;
  return { md: ud, rap };
}
